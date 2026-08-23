/**
 * Planner Agent
 * Decides node execution order based on DAG topology, validates dependencies,
 * and emits an agent confidence score.
 */
export class PlannerAgent {
  /**
   * Evaluates workflow structure and generates an ordered execution plan.
   * @param {Object} workflow - { nodes: [], edges: [] }
   * @returns {{ plan: Array, confidenceScore: number, warnings: Array }}
   */
  static async plan(workflow) {
    const nodes = workflow.nodes || [];
    const edges = workflow.edges || [];

    if (nodes.length === 0) {
      return {
        plan: [],
        confidenceScore: 0.0,
        warnings: ['Workflow contains no nodes']
      };
    }

    const inDegree = new Map();
    const adjList = new Map();
    const nodeMap = new Map();

    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      adjList.set(n.id, []);
      nodeMap.set(n.id, n);
    });

    edges.forEach((e) => {
      if (inDegree.has(e.target)) {
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      }
      if (adjList.has(e.source)) {
        adjList.get(e.source).push(e.target);
      }
    });

    // Topological Sort (Kahn's algorithm)
    const queue = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    const orderedPlan = [];
    const warnings = [];

    while (queue.length > 0) {
      const currId = queue.shift();
      const node = nodeMap.get(currId);
      if (node) {
        orderedPlan.push(node);
      }

      const neighbors = adjList.get(currId) || [];
      for (const nextId of neighbors) {
        inDegree.set(nextId, inDegree.get(nextId) - 1);
        if (inDegree.get(nextId) === 0) {
          queue.push(nextId);
        }
      }
    }

    // Check for cycles or unvisited nodes
    if (orderedPlan.length < nodes.length) {
      warnings.push('Circular dependency or disconnected cycle detected in workflow DAG. Executing accessible nodes.');
      // Append remaining nodes
      nodes.forEach((n) => {
        if (!orderedPlan.find((p) => p.id === n.id)) {
          orderedPlan.push(n);
        }
      });
    }

    // Calculate confidence score (based on completeness, triggers, valid connections)
    let score = 0.98;
    if (warnings.length > 0) score -= 0.15;
    if (!nodes.some((n) => n.type === 'trigger')) {
      warnings.push('No explicit trigger node found');
      score -= 0.08;
    }

    return {
      plan: orderedPlan,
      confidenceScore: Math.max(0.5, Math.min(1.0, Number(score.toFixed(2)))),
      warnings
    };
  }
}
