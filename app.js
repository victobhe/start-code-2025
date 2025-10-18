// ======================
// --- Canvas Setup ---
// ======================
const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');
const img = new Image();
img.src = 'storeMap.png';

let selectedCats = [];

// ======================
// --- Inline Nodes ---
// ======================
const nodes = [
  { "id": "B1", "x": 88, "y": 621, "type": "path" },
  { "id": "B2", "x": 88, "y": 400, "type": "path" },
  { "id": "B3", "x": 291, "y": 400, "type": "path" },
  { "id": "annet", "x": 291, "y": 561, "type": "path" },
  { "id": "B5", "x": 291, "y": 706, "type": "path" },
  { "id": "B6", "x": 497, "y": 400, "type": "path" },
  { "id": "B7", "x": 657, "y": 400, "type": "path" },
  { "id": "B8", "x": 657, "y": 561, "type": "path" },
  { "id": "B9", "x": 657, "y": 706, "type": "path" },
  { "id": "B10", "x": 771, "y": 706, "type": "path" },
  { "id": "B11", "x": 771, "y": 501, "type": "path" }, // kjøtt left side
  { "id": "snacks", "x": 771, "y": 271, "type": "path" },
  { "id": "B13", "x": 941, "y": 296, "type": "path" },
  { "id": "kjøtt_R", "x": 941, "y": 501, "type": "path" }, // kjøtt right side
  { "id": "B15", "x": 938, "y": 706, "type": "path" },
  { "id": "B16", "x": 1111, "y": 706, "type": "path" },
  { "id": "B17", "x": 1111, "y": 271, "type": "path" },
  { "id": "brød", "x": 941, "y": 181, "type": "path" },
  { "id": "B19", "x": 1111, "y": 181, "type": "path" },
  { "id": "B20", "x": 1111, "y": 31, "type": "path" },
  { "id": "B21", "x": 771, "y": 31, "type": "path" },
  { "id": "B22", "x": 557, "y": 31, "type": "path" },
  { "id": "B23", "x": 557, "y": 271, "type": "path" },
  { "id": "frukt", "x": 497, "y": 561, "type": "path" },
  { "id": "grønt", "x": 497, "y": 706, "type": "path" },
  { "id": "baking", "x": 1111, "y": 501, "type": "path" },
  { "id": "magasiner", "x": 941, "y": 31, "type": "path" },
  { "id": "R1", "x": 527, "y": 151, "type": "checkout", "label": "cashier" }
];

// ======================
// --- Connections ---
// ======================
const nodeConnections = {
  "B1": ["B2"],
  "B2": ["B1", "B3"],
  "B3": ["B2", "annet", "B6"],
  "annet": ["B3", "B5", "frukt"],
  "B5": ["annet", "grønt"],
  "B6": ["B3", "B7", "B23"],
  "B7": ["B6", "B8", "B11", "B23", "snacks"],
  "B8": ["B7", "B9", "B11", "frukt"],
  "B9": ["B8", "B10", "grønt"],
  "B10": ["B9", "B11", "B15"],
  "B11": ["B7", "B8", "B10", "snacks"], // unchanged
  "snacks": ["B11", "B13", "B23", "B7", "B21", "brød"],
  "B13": ["kjøtt_R", "brød", "B17", "B19"],
  "kjøtt_R": ["B13", "B15"], // independent, not connected to B11
  "B15": ["B10", "kjøtt_R", "B16"],
  "B16": ["B15", "baking"],
  "B17": ["B13", "brød", "B19", "baking"],
  "brød": ["B13", "B17", "B19"],
  "B19": ["B17", "brød", "B20"],
  "B20": ["B19", "magasiner"],
  "B21": ["B22", "magasiner", "snacks"],
  "B22": ["B21", "B23", "R1"],
  "B23": ["B6", "B7", "B22", "snacks"],
  "frukt": ["B8", "annet"],
  "grønt": ["B9", "B5"],
  "baking": ["B16", "B17"],
  "magasiner": ["B20", "B21"],
  "R1": ["B22", "B23"]
};

// ======================
// --- Category Aliases ---
// ======================
const categoryAliases = {
  kjøtt: ["kjøtt_R", "B11"],
  baking: ["baking","kjøtt_R"],
  frukt: ["frukt", "B6"]
};

// ======================
// --- UI Controls ---
// ======================
document.querySelectorAll('#sidebar input[type=checkbox]').forEach(cb => {
  cb.addEventListener('change', e => {
    if (e.target.checked) selectedCats.push(e.target.value);
    else selectedCats = selectedCats.filter(v => v !== e.target.value);
    drawMap();
  });
});

document.getElementById('routeBtn').addEventListener('click', () => {
  const path = computeShortestRoute(selectedCats);
  drawMap(path);
});

// ======================
// --- Utility Functions ---
// ======================
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function buildGraph() {
  const graph = {};
  for (const node of nodes) graph[node.id] = [];
  for (const [id, conns] of Object.entries(nodeConnections)) {
    const a = nodes.find(n => n.id === id);
    if (!a) continue;
    for (const cid of conns) {
      const b = nodes.find(n => n.id === cid);
      if (b) graph[id].push({ id: cid, cost: distance(a, b) });
    }
  }
  for (const [id, conns] of Object.entries(graph)) {
    for (const edge of conns) {
      if (!graph[edge.id].some(e => e.id === id)) {
        const a = nodes.find(n => n.id === id);
        const b = nodes.find(n => n.id === edge.id);
        graph[edge.id].push({ id, cost: distance(a, b) });
      }
    }
  }
  return graph;
}

function dijkstra(graph, startId, endId) {
  const dist = {}, prev = {};
  const q = new Set(Object.keys(graph));
  for (const id of q) dist[id] = Infinity;
  dist[startId] = 0;

  while (q.size) {
    let u = null, best = Infinity;
    for (const id of q) if (dist[id] < best) { best = dist[id]; u = id; }
    if (!u || u === endId) break;
    q.delete(u);
    for (const e of graph[u]) {
      const alt = dist[u] + e.cost;
      if (alt < dist[e.id]) { dist[e.id] = alt; prev[e.id] = u; }
    }
  }
  const path = [];
  let u = endId;
  if (!(u in prev) && u !== startId) return [startId];
  while (u) { path.unshift(u); if (u === startId) break; u = prev[u]; }
  return path;
}

function pathLength(nodesOrIds) {
  let total = 0;
  for (let i = 0; i < nodesOrIds.length - 1; i++) {
    const a = nodes.find(n => n.id === nodesOrIds[i]);
    const b = nodes.find(n => n.id === nodesOrIds[i + 1]);
    total += distance(a, b);
  }
  return total;
}

function permute(arr) {
  if (arr.length <= 1) return [arr];
  const res = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permute(rest)) res.push([arr[i]].concat(p));
  }
  return res;
}

// ======================
// --- Route Computation ---
// ======================
function computeShortestRoute(selected) {
  const graph = buildGraph();
  const entrance = nodes.find(n => n.id === "B1");
  const checkout = nodes.find(n => n.id === "R1");

  // Expand selected categories into groups of alias node IDs
  const categoryGroups = selected.map(cat => {
    const ids = categoryAliases[cat] || [cat];
    return ids.map(id => nodes.find(n => n.id === id)).filter(Boolean);
  }).filter(g => g.length);

  if (!categoryGroups.length) {
    alert("Select at least one category!");
    return [];
  }

  // Try every order of category groups (not individual nodes)
  const orders = permute(categoryGroups);
  let bestPath = [], bestDist = Infinity;

  for (const order of orders) {
    let current = entrance;
    let fullPath = [entrance];
    for (const group of order) {
      // Choose the closest node within this category group
      let bestGroupNode = null;
      let bestSubPath = [];
      let bestSubDist = Infinity;
      for (const candidate of group) {
        const seg = dijkstra(graph, current.id, candidate.id);
        const dist = pathLength(seg);
        if (dist < bestSubDist) {
          bestSubDist = dist;
          bestGroupNode = candidate;
          bestSubPath = seg;
        }
      }
      if (bestSubPath.length > 1) bestSubPath.shift();
      fullPath = fullPath.concat(bestSubPath.map(id => nodes.find(n => n.id === id)));
      current = bestGroupNode;
    }
    // Finally, go to checkout
    const toCheckout = dijkstra(graph, current.id, checkout.id);
    if (toCheckout.length > 1) toCheckout.shift();
    fullPath = fullPath.concat(toCheckout.map(id => nodes.find(n => n.id === id)));

    const dist = pathLength(fullPath.map(n => n.id));
    if (dist < bestDist) { bestDist = dist; bestPath = fullPath; }
  }

  return bestPath;
}


// --- Drawing functions ---
function drawMap(path = []) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  drawStaticMap();
  if (path.length > 1) animateTrail(path);
}

function drawStaticMap() {
  const drawnConnections = new Set();
  for (const [nodeId, connections] of Object.entries(nodeConnections)) {
    const n1 = nodes.find(n => n.id === nodeId);
    if (!n1) continue;
    for (const cid of connections) {
      const n2 = nodes.find(n => n.id === cid);
      if (!n2) continue;
      const key = [nodeId, cid].sort().join('-');
      if (drawnConnections.has(key)) continue;
      drawnConnections.add(key);

      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();
    }
  }
  // Path nodes
  ctx.fillStyle = '#023EA5';
  for (const n of nodes.filter(n => n.type === 'path')) {
    ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI * 2); ctx.fill();
  }
  // Labels
  ctx.fillStyle = '#023EA5';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  for (const n of nodes.filter(n => n.type === 'path')) {
    ctx.fillText(n.id, n.x, n.y - 10);
  }
  // Checkout
  const chk = nodes.find(n => n.type === 'checkout');
  ctx.fillStyle = '#FF1500';
  ctx.beginPath(); ctx.arc(chk.x, chk.y, 10, 0, Math.PI * 2); ctx.fill();
}

// --- Animated treasure trail ---
function animateTrail(path) {
  const smoothed = smoothPath(path, 8);
  const totalDist = totalPathDistance(smoothed);
  let progress = 0;
  const drawSpeed = 8;
  let fadingOut = false;
  let fadeAlpha = 1.0;

  // Helper: draw the full red dashed trail
  function drawTrail() {
    ctx.strokeStyle = '#D71F2E';
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(smoothed[0].x, smoothed[0].y);
    for (let i = 1; i < smoothed.length; i++) ctx.lineTo(smoothed[i].x, smoothed[i].y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // --- Main animation loop ---
  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    drawStaticMap();

    // Draw partially completed dashed trail
    ctx.strokeStyle = '#D71F2E';
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(smoothed[0].x, smoothed[0].y);

    let drawn = 0;
    let dotX = smoothed[0].x;
    let dotY = smoothed[0].y;

    for (let i = 1; i < smoothed.length; i++) {
      const seg = distance(smoothed[i - 1], smoothed[i]);
      if (drawn + seg > progress) {
        const remain = progress - drawn;
        const ratio = remain / seg;
        dotX = smoothed[i - 1].x + (smoothed[i].x - smoothed[i - 1].x) * ratio;
        dotY = smoothed[i - 1].y + (smoothed[i].y - smoothed[i - 1].y) * ratio;
        ctx.lineTo(dotX, dotY);
        break;
      } else {
        ctx.lineTo(smoothed[i].x, smoothed[i].y);
      }
      drawn += seg;
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw moving dark gray dot
    if (progress < totalDist) {
      ctx.globalAlpha = fadeAlpha;
      ctx.fillStyle = '#373432';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    progress += drawSpeed;

    if (progress < totalDist) {
      requestAnimationFrame(step);
    } else if (!fadingOut) {
      fadingOut = true;
      fadeDot(dotX, dotY);
    }
  }

  // --- Fading out the final dot while preserving trail ---
  function fadeDot(x, y) {
    fadeAlpha -= 0.05;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    drawStaticMap();
    drawTrail();

    if (fadeAlpha > 0) {
      ctx.globalAlpha = fadeAlpha;
      ctx.fillStyle = '#373432';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      requestAnimationFrame(() => fadeDot(x, y));
    } else {
      // Once dot fades completely → draw static map & trail & hoist flag
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      drawStaticMap();
      drawTrail();
      hoistFlag(smoothed[smoothed.length - 1], drawTrail);
    }
  }

  step();
}

// --- Helper: create smooth Catmull-Rom spline interpolation ---
function smoothPath(points, resolution = 10) {
  if (points.length < 3) return points;
  const result = [];
  for (let i = -1; i < points.length - 2; i++) {
    const p0 = points[Math.max(i, 0)];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[Math.min(i + 3, points.length - 1)];

    for (let t = 0; t <= 1; t += 1 / resolution) {
      const tt = t * t;
      const ttt = tt * t;

      const q1 = -ttt + 2 * tt - t;
      const q2 = 3 * ttt - 5 * tt + 2;
      const q3 = -3 * ttt + 4 * tt + t;
      const q4 = ttt - tt;

      const x = 0.5 * (p0.x * q1 + p1.x * q2 + p2.x * q3 + p3.x * q4);
      const y = 0.5 * (p0.y * q1 + p1.y * q2 + p2.y * q3 + p3.y * q4);
      result.push({ x, y });
    }
  }
  return result;
}

// --- Helper: create smooth Catmull-Rom spline interpolation ---
function smoothPath(points, resolution = 10) {
  if (points.length < 3) return points;
  const result = [];
  for (let i = -1; i < points.length - 2; i++) {
    const p0 = points[Math.max(i, 0)];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[Math.min(i + 3, points.length - 1)];

    for (let t = 0; t <= 1; t += 1 / resolution) {
      const tt = t * t;
      const ttt = tt * t;

      const q1 = -ttt + 2 * tt - t;
      const q2 = 3 * ttt - 5 * tt + 2;
      const q3 = -3 * ttt + 4 * tt + t;
      const q4 = ttt - tt;

      const x = 0.5 * (p0.x * q1 + p1.x * q2 + p2.x * q3 + p3.x * q4);
      const y = 0.5 * (p0.y * q1 + p1.y * q2 + p2.y * q3 + p3.y * q4);
      result.push({ x, y });
    }
  }
  return result;
}


function totalPathDistance(path) {
  let sum = 0;
  for (let i = 0; i < path.length - 1; i++)
    sum += distance(path[i], path[i + 1]);
  return sum;
}
// --- Flag hoist animation (smooth fade/raise) ---
// --- Flag hoist animation (flag raises smoothly, trail remains visible) ---
function hoistFlag(endpoint, drawTrail) {
  const flagWidth = 26;
  const flagHeight = 18;
  const poleHeight = flagHeight * 1.6;
  const squareSize = 6;
  let frame = 0;
  const duration = 40; // frames (~0.6s)

  function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    drawStaticMap();
    if (drawTrail) drawTrail(); // keep trail visible

    const progress = Math.min(frame / duration, 1);
    const lift = (1 - progress) * 30; // start lower, rise upward
    const alpha = progress;

    ctx.globalAlpha = alpha;

    // Draw pole
    ctx.strokeStyle = '#373432';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(endpoint.x, endpoint.y);
    ctx.lineTo(endpoint.x, endpoint.y - poleHeight + lift);
    ctx.stroke();

    // Draw checkered flag
    const flagTopY = endpoint.y - poleHeight + 4 + lift;
    const flagLeftX = endpoint.x + 4;

    for (let i = 0; i < flagHeight / squareSize; i++) {
      for (let j = 0; j < flagWidth / squareSize; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? '#000' : '#FFF';
        ctx.fillRect(flagLeftX + j * squareSize, flagTopY + i * squareSize, squareSize, squareSize);
      }
    }

    // Outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(flagLeftX, flagTopY, flagWidth, flagHeight);
    ctx.globalAlpha = 1;

    frame++;
    if (progress < 1) {
      requestAnimationFrame(drawFrame);
    } else {
      // Final static frame (fully raised flag, full opacity)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      drawStaticMap();
      if (drawTrail) drawTrail();

      ctx.strokeStyle = '#373432';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(endpoint.x, endpoint.y);
      ctx.lineTo(endpoint.x, endpoint.y - poleHeight);
      ctx.stroke();

      const finalTopY = endpoint.y - poleHeight + 4;
      const finalLeftX = endpoint.x + 4;
      for (let i = 0; i < flagHeight / squareSize; i++) {
        for (let j = 0; j < flagWidth / squareSize; j++) {
          ctx.fillStyle = (i + j) % 2 === 0 ? '#000' : '#FFF';
          ctx.fillRect(finalLeftX + j * squareSize, finalTopY + i * squareSize, squareSize, squareSize);
        }
      }
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(finalLeftX, finalTopY, flagWidth, flagHeight);
    }
  }

  drawFrame();
}


