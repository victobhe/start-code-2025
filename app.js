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

  { "id": "baking", "x": 1028, "y": 501, "type": "category", "label": "baking" },
  { "id": "brød", "x": 938, "y": 91, "type": "category", "label": "brød" },
  { "id": "kjøtt", "x": 853, "y": 501, "type": "category", "label": "kjøtt" },
  { "id": "snacks", "x": 657, "y": 151, "type": "category", "label": "snacks" },
  { "id": "frukt", "x": 497, "y": 490, "type": "category", "label": "frukt" },
  { "id": "grønt", "x": 497, "y": 631, "type": "category", "label": "grønt" },
  { "id": "annet", "x": 231, "y": 612, "type": "category", "label": "annet" },

  { "id": "R1", "x": 527, "y": 151, "type": "checkout", "label": "cashier" }
];

// --- Predefined connections between all nodes (blue nodes AND categories) ---
const nodeConnections = {
  // Blue node connections
  "B1": ["B2", "B3"], // From entrance, can go to B2 or B3
  "B2": ["B1"], // From B2, can go back to B1 or continue to B5
  "B3": ["B1", "B4", "B6"], // From B3, can go to B1, B4, or B6
  "B4": ["B3", "B5", "B7", "annet", "frukt", "grønt"], // From B4, can go to B3, B5, B7, or annet category
  "B5": ["B4", "B8", "annet", "grønt"], // From B5, can go to B2, B4, or B8
  "B6": ["B3", "B7", "B10"], // From B6, can go to B3, B7, or B10
  "B7": ["B4", "B6", "B8", "B11", "frukt", "grønt", "kjøtt"], // From B7, can go to B4, B6, B8, B11, frukt, or grønt
  "B8": ["B5", "B7", "B12", "grønt"], // From B8, can go to B5, B7, or B12
  "B9": ["B10", "B13", "brød"], // From B9, can go to B10 or B13
  "B10": ["B6", "B9", "B11", "snacks", "R1", "brød"], // From B10, can go to B6, B9, B11, snacks, or cashier
  "B11": ["B7", "B10", "B12", "B14", "brød", "kjøtt"], // From B11, can go to B7, B10, B12, B14, brød, or kjøtt
  "B12": ["B8", "B11", "B15", "kjøtt"], // From B12, can go to B8, B11, or B15
  "B13": ["B9", "B14", "brød"], // From B13, can go to B9 or B14
  "B14": ["B11", "B13", "B15", "baking", "brød"], // From B14, can go to B11, B13, B15, or baking
  "B15": ["B12", "B14", "baking"], // From B15, can go to B12 or B14
  
  // Category connections (can connect back to their blue nodes)
  "baking": ["B14"], // Baking connects to B14
  "brød": ["B11"], // Brød connects to B11
  "kjøtt": ["B11", "baking"], // Kjøtt connects to B11 and baking
  "snacks": ["B10", "R1"], // Snacks connects to B10
  "frukt": ["B7", "B4", "grønt"],  // Frukt connects to B7, B4, and grønt
  "grønt": ["B7"],  // Grønt connects to B7
  "annet": ["B4"],  // Annet connects to B4
  
  // Checkout connection
  "R1": ["B10"]  // Cashier connects to B10
};

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

// --- Graph builder (uses predefined connections for all nodes) ---
function buildGraph() {
  const graph = {};
  
  // Initialize graph with all nodes (blue, category, and checkout)
  for (const node of nodes) {
    graph[node.id] = [];
  }
  
  // Add connections based on predefined nodeConnections
  for (const [nodeId, connections] of Object.entries(nodeConnections)) {
    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) continue;
    
    for (const connectedId of connections) {
      const connectedNode = nodes.find(n => n.id === connectedId);
      if (connectedNode) {
        graph[nodeId].push({
          id: connectedId,
          cost: distance(currentNode, connectedNode)
        });
      }
    }
  }
  
  // Ensure all connections are bidirectional
  for (const [nodeId, connections] of Object.entries(graph)) {
    for (const connection of connections) {
      const reverseId = connection.id;
      // Check if reverse connection exists
      const reverseExists = graph[reverseId] && graph[reverseId].some(conn => conn.id === nodeId);
      
      if (!reverseExists && graph[reverseId]) {
        // Add the reverse connection
        const nodeA = nodes.find(n => n.id === nodeId);
        const nodeB = nodes.find(n => n.id === reverseId);
        if (nodeA && nodeB) {
          graph[reverseId].push({
            id: nodeId,
            cost: distance(nodeA, nodeB)
          });
        }
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
function pathLength(nodesOrIds) {
  let total = 0;
  for (let i = 0; i < nodesOrIds.length - 1; i++) {
    let a, b;
    if (typeof nodesOrIds[i] === 'string') {
      // If it's an ID, find the node
      a = nodes.find(n => n.id === nodesOrIds[i]);
      b = nodes.find(n => n.id === nodesOrIds[i + 1]);
    } else {
      // If it's already a node object
      a = nodesOrIds[i];
      b = nodesOrIds[i + 1];
    }
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
  const graph = buildGraph();
  const entrance = nodes.find(n => n.id === "B1"); // Starting point
  const checkout = nodes.find(n => n.id === "R1"); // Checkout

  // Get category nodes by their IDs (which are now the same as labels)
  const categoryNodes = selected.map(cat => {
    return nodes.find(n => n.id === cat);
  }).filter(node => node !== null);

  if (categoryNodes.length === 0) {
    alert("Select at least one category!");
    return [];
  }

  // Try all orders → find shortest
  const orders = permute(categoryNodes);
  let bestPath = [];
  let bestDist = Infinity;

  for (const order of orders) {
    let current = entrance;
    let fullPath = [entrance];
    
    // Visit each category in this order
    for (const categoryNode of order) {
      const pathSegment = dijkstra(graph, current.id, categoryNode.id);
      if (pathSegment.length > 1) {
        pathSegment.shift(); // Remove first node to avoid duplication
        fullPath = fullPath.concat(pathSegment.map(id => nodes.find(n => n.id === id)));
      }
      current = categoryNode;
    }
    
    // Path from last category to checkout
    const pathToCheckout = dijkstra(graph, current.id, checkout.id);
    if (pathToCheckout.length > 1) {
      pathToCheckout.shift(); // Remove first node to avoid duplication
      fullPath = fullPath.concat(pathToCheckout.map(id => nodes.find(n => n.id === id)));
    }

    const dist = pathLength(fullPath);
    if (dist < bestDist) {
      bestDist = dist;
      bestPath = fullPath;
    }
  }

  return bestPath;
}

// --- Drawing ---
function drawMap(path = []) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Draw all connections (gray for blue-to-blue, blue dashed for category connections)
  const drawnConnections = new Set(); // Track drawn connections to avoid duplicates
  
  for (const [nodeId, connections] of Object.entries(nodeConnections)) {
    const currentNode = nodes.find(n => n.id === nodeId);
    if (!currentNode) continue;
    
    for (const connectedId of connections) {
      const connectedNode = nodes.find(n => n.id === connectedId);
      if (connectedNode) {
        // Create a unique key for this connection (sorted to avoid duplicates)
        const connectionKey = [nodeId, connectedId].sort().join('-');
        if (drawnConnections.has(connectionKey)) continue;
        drawnConnections.add(connectionKey);
        
        // Different styles based on connection type
        if (currentNode.type === 'path' && connectedNode.type === 'path') {
          // Blue-to-blue connections: solid gray
          ctx.strokeStyle = '#E5E7EB';
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
        } else {
          // Category connections: dashed blue
          ctx.strokeStyle = '#60A5FA';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
        }
        
        ctx.beginPath();
        ctx.moveTo(currentNode.x, currentNode.y);
        ctx.lineTo(connectedNode.x, connectedNode.y);
        ctx.stroke();
      }
    }
  }
  ctx.setLineDash([]); // Reset to solid lines

  // Blue path nodes
  ctx.fillStyle = '#023EA5';
  for (const n of nodes.filter(n => n.type === 'path')) {
    ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI * 2); ctx.fill();
  }

  // Blue node labels for development
  ctx.fillStyle = '#023EA5';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  for (const n of nodes.filter(n => n.type === 'path')) {
    ctx.fillText(n.id, n.x, n.y - 10);
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
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    
    // Add numbered markers for the route order
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    let stepNumber = 1;
    for (let i = 0; i < path.length; i++) {
      const node = path[i];
      if (node.type === 'category' || node.type === 'checkout' || (node.type === 'path' && i === 0)) {
        // Draw white circle background for number
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw number
        ctx.fillStyle = 'white';
        ctx.fillText(stepNumber.toString(), node.x, node.y + 4);
        stepNumber++;
      }
    }
  }
}
