const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');
const img = new Image();
img.src = 'storeMap.png';

let selectedCats = [];

// --- Inline nodes data ---
const nodes = [
  { "id": "B1", "x": 88, "y": 400, "type": "path" },
  { "id": "B2", "x": 88, "y": 621, "type": "path" },
  { "id": "B3", "x": 291, "y": 400, "type": "path" },
  { "id": "B4", "x": 291, "y": 561, "type": "path" },
  { "id": "B5", "x": 291, "y": 706, "type": "path" },
  { "id": "B6", "x": 657, "y": 400, "type": "path" },
  { "id": "B7", "x": 657, "y": 561, "type": "path" },
  { "id": "B8", "x": 657, "y": 706, "type": "path" },
  { "id": "B9", "x": 771, "y": 31, "type": "path" },
  { "id": "B10", "x": 771, "y": 211, "type": "path" },
  { "id": "B11", "x": 938, "y": 211, "type": "path" },
  { "id": "B12", "x": 938, "y": 706, "type": "path" },
  { "id": "B13", "x": 1111, "y": 31, "type": "path" },
  { "id": "B14", "x": 1111, "y": 271, "type": "path" },
  { "id": "B15", "x": 1111, "y": 706, "type": "path" },

  { "id": "C1", "x": 1028, "y": 501, "type": "category", "label": "baking" },
  { "id": "C2", "x": 938, "y": 91, "type": "category", "label": "brød" },
  { "id": "C3", "x": 853, "y": 501, "type": "category", "label": "kjøtt" },
  { "id": "C4", "x": 657, "y": 151, "type": "category", "label": "snacks" },
  { "id": "C5", "x": 497, "y": 490, "type": "category", "label": "frukt" },
  { "id": "C6", "x": 497, "y": 631, "type": "category", "label": "grønt" },
  { "id": "C7", "x": 231, "y": 612, "type": "category", "label": "annet" },

  { "id": "R1", "x": 527, "y": 151, "type": "checkout", "label": "cashier" }
];

// --- UI Events ---
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

// --- Utility ---
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// --- Graph builder (connects nearby blue nodes) ---
function buildGraph(threshold = 300) {
  const graph = {};
  const blue = nodes.filter(n => n.type === 'path');
  for (const n of blue) {
    graph[n.id] = [];
    for (const m of blue) {
      if (n.id !== m.id && distance(n, m) < threshold) {
        graph[n.id].push({ id: m.id, cost: distance(n, m) });
      }
    }
  }
  return graph;
}

// --- Dijkstra shortest path ---
function dijkstra(graph, startId, endId) {
  const dist = {};
  const prev = {};
  const q = new Set(Object.keys(graph));
  for (const id of q) dist[id] = Infinity;
  dist[startId] = 0;

  while (q.size) {
    let u = null, best = Infinity;
    for (const id of q) if (dist[id] < best) { best = dist[id]; u = id; }
    if (!u || u === endId) break;
    q.delete(u);
    for (const edge of graph[u]) {
      const alt = dist[u] + edge.cost;
      if (alt < dist[edge.id]) {
        dist[edge.id] = alt;
        prev[edge.id] = u;
      }
    }
  }

  const path = [];
  let u = endId;
  if (!(u in prev) && u !== startId) return [startId];
  while (u) {
    path.unshift(u);
    if (u === startId) break;
    u = prev[u];
  }
  return path;
}

// --- Helper: nearest blue node ---
function nearestBlueNode(x, y) {
  const blue = nodes.filter(n => n.type === 'path');
  let nearest = blue[0];
  let best = Infinity;
  for (const b of blue) {
    const d = distance({ x, y }, b);
    if (d < best) { best = d; nearest = b; }
  }
  return nearest;
}

// --- Helper: total path length ---
function pathLength(ids) {
  let total = 0;
  for (let i = 0; i < ids.length - 1; i++) {
    const a = nodes.find(n => n.id === ids[i]);
    const b = nodes.find(n => n.id === ids[i + 1]);
    total += distance(a, b);
  }
  return total;
}

// --- Permutations ---
function permute(arr) {
  if (arr.length <= 1) return [arr];
  const res = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permute(rest)) res.push([arr[i]].concat(p));
  }
  return res;
}

// --- Compute full route (shortest order) ---
function computeShortestRoute(selected) {
  const graph = buildGraph(300);
  const blue = nodes.filter(n => n.type === 'path');
  const entrance = blue[0]; // starting point
  const checkout = nodes.find(n => n.type === 'checkout');
  const checkoutNode = nearestBlueNode(checkout.x, checkout.y);

  const catNodes = selected.map(cat => {
    const c = nodes.find(n => n.label === cat);
    return nearestBlueNode(c.x, c.y);
  });

  if (catNodes.length === 0) {
    alert("Select at least one category!");
    return [];
  }

  // Try all orders → find shortest
  const orders = permute(catNodes);
  let bestPath = [];
  let bestDist = Infinity;

  for (const order of orders) {
    let current = entrance;
    let fullPath = [];
    for (const target of order) {
      const leg = dijkstra(graph, current.id, target.id);
      if (fullPath.length) leg.shift();
      fullPath = fullPath.concat(leg);
      current = target;
    }
    const lastLeg = dijkstra(graph, current.id, checkoutNode.id);
    lastLeg.shift();
    fullPath = fullPath.concat(lastLeg);

    const dist = pathLength(fullPath);
    if (dist < bestDist) {
      bestDist = dist;
      bestPath = fullPath;
    }
  }

  return bestPath.map(id => nodes.find(n => n.id === id));
}

// --- Drawing ---
function drawMap(path = []) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Blue path nodes
  ctx.fillStyle = '#023EA5';
  for (const n of nodes.filter(n => n.type === 'path')) {
    ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI * 2); ctx.fill();
  }

  // Black category nodes
  for (const n of nodes.filter(n => n.type === 'category' && selectedCats.includes(n.label))) {
    ctx.fillStyle = '#373432';
    ctx.beginPath(); ctx.arc(n.x, n.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '10px sans-serif';
    ctx.fillText(n.label, n.x - 15, n.y - 12);
  }

  // Red checkout
  const chk = nodes.find(n => n.type === 'checkout');
  ctx.fillStyle = '#FF1500';
  ctx.beginPath(); ctx.arc(chk.x, chk.y, 10, 0, Math.PI * 2); ctx.fill();

  // Orange path
  if (path.length > 1) {
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
  }
}
