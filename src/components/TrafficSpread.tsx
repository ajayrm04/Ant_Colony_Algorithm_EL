import React from "react";
import { drawEdgeWithPheromone, drawNode } from "../utils/animationUtils";
import { Node, Edge, NodeType } from "../types/networkTypes";
import { HistoricalRoute } from "../types/analysisTypes";
import { generateRandomPath } from "../utils/analysisUtils";

// Extend the Window interface to include _nearestRouters
declare global {
  interface Window {
    _nearestRouters?: any[];
  }
}

interface TrafficSpreadProps {
  nodes: Node[];
  edges: Edge[];
  trafficPattern: Record<string, number>;
  onClose: () => void;
}

export function generateSampleHistoricalData(nodes: Node[], edges: Edge[], count = 100): HistoricalRoute[] {
  if (nodes.length < 2) return []

  const routes: HistoricalRoute[] = []
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000

  // Get device nodes for source/target
  const deviceNodes = nodes.filter((node) => node.type === NodeType.DEVICE)
  if (deviceNodes.length < 2) return []

  for (let i = 0; i < count; i++) {
    // Select random source and target devices
    const sourceIndex = Math.floor(Math.random() * deviceNodes.length)
    let targetIndex
    do {
      targetIndex = Math.floor(Math.random() * deviceNodes.length)
    } while (targetIndex === sourceIndex)

    const sourceId = deviceNodes[sourceIndex].id
    const targetId = deviceNodes[targetIndex].id

    // Generate a random path between source and target
    const path = generateRandomPath(sourceId, targetId, nodes, edges)

    // Calculate metrics
    const hops = path.length - 1
    const latency = 10 + hops * 5 + Math.random() * 20 // Base latency + hop latency + random variation
    const congestion = Math.random() * 0.7 // Random congestion value

    routes.push({
      id: `route-${i}`,
      timestamp: now - Math.floor(Math.random() * 7 * oneDay), // Random time in the last week
      sourceId,
      targetId,
      path,
      latency,
      hops,
      congestion,
    })
  }

  console.log("routes\n\n")
console.log(JSON.stringify(routes, null, 2))
  return routes
}


const CANVAS_WIDTH = Math.floor(window.innerWidth * 0.8);
const CANVAS_HEIGHT = Math.floor(window.innerHeight * 0.7);

const TrafficSpread: React.FC<TrafficSpreadProps> = ({ nodes, edges, trafficPattern, onClose }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Debug logs
  React.useEffect(() => {
    console.log("TrafficSpread nodes", nodes);
    console.log("TrafficSpread edges", edges);
    console.log("TrafficSpread trafficPattern", trafficPattern);
  }, [nodes, edges, trafficPattern]);

  // Resize and draw logic combined
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) return;
      const key = `${edge.source}-${edge.target}`;
      const reverseKey = `${edge.target}-${edge.source}`;
      const traffic = trafficPattern[key] || trafficPattern[reverseKey] || 0;
      drawEdgeWithPheromone(ctx, source, target, traffic, false, edge, false, true);
    });

    // Draw nodes
    nodes.forEach(node => {
      drawNode(ctx, node, false, false, true);
    });

    // --- Generate and use sample historical data for heatmap ---
    const generatedRoutes = generateSampleHistoricalData(nodes, edges, 100);
    // Count how many times each node appears in generated routes
    const nodeTraffic: Record<number, number> = {};
    generatedRoutes.forEach(route => {
      route.path.forEach(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        if (node && node.type === NodeType.ROUTER) {
          nodeTraffic[nodeId] = (nodeTraffic[nodeId] || 0) + 1;
        }
      });
    });
    // Find the max count for normalization
    const maxTraffic = Object.values(nodeTraffic).reduce((max, v) => Math.max(max, v), 1);
    // Get top 5 nodes by traffic
    const topNodes = Object.entries(nodeTraffic)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({
        node: nodes.find(n => n.id === Number(id)),
        count
      }))
      .filter(item => item.node);

    // 1. Draw heatmaps for routers in topNodes
    topNodes.forEach((item, idx) => {
      const node = item.node;
      if (!node) return;
      // Higher rank (closer to 0) gets bigger radius and more alpha
      let radius = 28 - idx * 4 + 18 * (item.count / maxTraffic);
      let alpha = 0.38 + 0.18 * ((topNodes.length - idx) / topNodes.length);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(255,0,0,${alpha})`;
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.restore();
    });

    // 2. For routers not in topNodes, find nearest topNode and apply half heatmap
    const routerNodes = nodes.filter(n => n.type === NodeType.ROUTER);
    const topNodeIds = new Set(topNodes.map(item => item.node?.id));
    routerNodes
      .filter(node => !topNodeIds.has(node.id))
      .forEach(node => {
        // Dijkstra's algorithm to find nearest topNode
        const unvisited = new Set(routerNodes.map(n => n.id));
        const distances: Record<number, number> = {};
        routerNodes.forEach(n => { distances[n.id] = Infinity; });
        distances[node.id] = 0;
        while (unvisited.size > 0) {
          let currentId: number | null = null;
          let minDist = Infinity;
          unvisited.forEach(id => {
            if (distances[id] < minDist) {
              minDist = distances[id];
              currentId = id;
            }
          });
          if (currentId === null) break;
          unvisited.delete(currentId);
          // If current is a topNode, stop
          if (topNodeIds.has(currentId)) break;
          // Update neighbors
          edges.forEach(edge => {
            if (edge.source === currentId || edge.target === currentId) {
              const neighborId = edge.source === currentId ? edge.target : edge.source;
              if (!unvisited.has(neighborId)) return;
              const alt = distances[currentId] + 1;
              if (alt < distances[neighborId]) {
                distances[neighborId] = alt;
              }
            }
          });
        }
        // Find the nearest topNode id
        let nearestTopNodeId: number | null = null;
        let minTopDist = Infinity;
        topNodes.forEach(item => {
          if (item.node && distances[item.node.id] < minTopDist) {
            minTopDist = distances[item.node.id];
            nearestTopNodeId = item.node.id;
          }
        });

        // Store the current router and its nearest topNode in a list
        if (nearestTopNodeId !== null) {
          if (!window._nearestRouters) window._nearestRouters = [];
          window._nearestRouters.push({
            router: node,
            nearestTopNode: nodes.find(n => n.id === nearestTopNodeId),
            distance: minTopDist
          });
        }
        if (nearestTopNodeId !== null) {
          const topIndex = topNodes.findIndex(item => item.node && item.node.id === nearestTopNodeId);
          const topNode = topNodes[topIndex];
          // Use half the radius and alpha of the nearest topNode
            let radius = (28 - topIndex * 4 + 18 * (topNode.count / maxTraffic)) * 0.6;
            let alpha = (0.38 + 0.18 * ((topNodes.length - topIndex) / topNodes.length)) * 0.6;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(255,0,0,${alpha})`;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.restore();
        }
      });
    // --- End custom heatmap logic ---
  }, [nodes, edges, trafficPattern]);

  // Responsive canvas size on window resize
  React.useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.floor(window.innerWidth * 0.8);
      canvas.height = Math.floor(window.innerHeight * 0.7);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
      <div className="relative bg-gray-900 rounded-lg shadow-lg p-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
        >
          Close
        </button>
        <h2 className="text-lg text-white mb-2">Traffic Spread Visualization</h2>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ background: "#181a20", borderRadius: 8 }}
        />
        <div className="text-gray-300 mt-2">
          Red spots indicate new traffic hotspots after spreading traffic among routers.
        </div>
        {/* Show nearest routers info */}
        <div className="mt-4 bg-gray-800 rounded p-2 max-h-64 overflow-y-auto text-xs text-gray-200">
          <div className="font-bold mb-1">Nearest Routers:</div>
            {Array.isArray(window._nearestRouters) && window._nearestRouters.length > 0 ? (
            <ul>
              {Array.from(
              new Map(
                window._nearestRouters.map(item => [
                item.router?.id,
                item
                ])
              ).values()
              ).map((item, idx) => (
              <li key={idx} className="mb-1">
                <span className="font-semibold">Router:</span> {item.router?.label || item.router?.id} &rarr;{" "}
                <span className="font-semibold">Nearest TopNode:</span> {item.nearestTopNode?.label || item.nearestTopNode?.id}{" "}
                <span className="font-semibold">Distance:</span> {item.distance}
              </li>
              ))}
            </ul>
            ) : (
            <div>No nearest router data available.</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TrafficSpread; 
