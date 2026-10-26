import type { Algorithm, Cell, Point, SearchEvent, SearchResult } from '../types';
import { keyOf } from '../types';

class MinHeap<T> {
  private a: { item: T; priority: number; order: number }[] = []; private order = 0;
  push(item: T, priority: number) { const n = { item, priority, order: this.order++ }; this.a.push(n); let i = this.a.length - 1; while (i) { const p = (i - 1) >> 1; if (this.cmp(this.a[p], n) <= 0) break; this.a[i] = this.a[p]; i = p; } this.a[i] = n; }
  pop() { if (!this.a.length) return undefined; const top = this.a[0]; const last = this.a.pop()!; if (this.a.length) { let i = 0; while (i * 2 + 1 < this.a.length) { let c = i * 2 + 1; if (c + 1 < this.a.length && this.cmp(this.a[c + 1], this.a[c]) < 0) c++; if (this.cmp(last, this.a[c]) <= 0) break; this.a[i] = this.a[c]; i = c; } this.a[i] = last; } return top; }
  peek() { return this.a[0]; }
  get size() { return this.a.length; }
  private cmp(a: { priority: number; order: number }, b: { priority: number; order: number }) { return a.priority - b.priority || a.order - b.order; }
}
function bidirectionalDijkstra(grid: Cell[][], start: Point, end: Point): { result: SearchResult; events: SearchEvent[] } {
  const begin = performance.now(), rows = grid.length, cols = grid[0]?.length ?? 0;
  const inside = (p: Point) => p.row >= 0 && p.col >= 0 && p.row < rows && p.col < cols;
  const neighbors = (p: Point) => [{ row: p.row - 1, col: p.col }, { row: p.row, col: p.col + 1 }, { row: p.row + 1, col: p.col }, { row: p.row, col: p.col - 1 }].filter(q => inside(q) && !grid[q.row][q.col].wall);
  const startKey = keyOf(start), endKey = keyOf(end), validEndpoints = inside(start) && inside(end) && !grid[start.row][start.col].wall && !grid[end.row][end.col].wall;
  const forwardHeap = new MinHeap<Point>(), backwardHeap = new MinHeap<Point>();
  const forwardDistance = new Map<string, number>([[startKey, 0]]), backwardDistance = new Map<string, number>([[endKey, 0]]);
  const forwardParent = new Map<string, Point>(), backwardNext = new Map<string, Point>();
  const forwardSettled = new Set<string>(), backwardSettled = new Set<string>(), openForward = new Set<string>([startKey]), openBackward = new Set<string>([endKey]);
  const visited: Point[] = [], visitedKeys = new Set<string>(), events: SearchEvent[] = [];
  let meeting: Point | null = null, bestCost = Infinity;
  if (validEndpoints) { forwardHeap.push(start, 0); backwardHeap.push(end, 0); }
  const nextPriority = (heap: MinHeap<Point>, distances: Map<string, number>, settled: Set<string>) => {
    while (heap.size) { const top = heap.peek()!, key = keyOf(top.item); if (settled.has(key) || top.priority !== distances.get(key)) { heap.pop(); continue; } return top.priority; }
    return Infinity;
  };
  const considerMeeting = (point: Point) => { const key = keyOf(point), fromStart = forwardDistance.get(key), toEnd = backwardDistance.get(key); if (fromStart !== undefined && toEnd !== undefined && fromStart + toEnd < bestCost) { bestCost = fromStart + toEnd; meeting = point; } };
  while (validEndpoints && startKey !== endKey) {
    const minForward = nextPriority(forwardHeap, forwardDistance, forwardSettled), minBackward = nextPriority(backwardHeap, backwardDistance, backwardSettled);
    if (!Number.isFinite(minForward) || !Number.isFinite(minBackward) || minForward + minBackward >= bestCost) break;
    const forward = minForward <= minBackward, heap = forward ? forwardHeap : backwardHeap, distances = forward ? forwardDistance : backwardDistance, settled = forward ? forwardSettled : backwardSettled, open = forward ? openForward : openBackward, item = heap.pop()!;
    const at = item.item, atKey = keyOf(at), currentDistance = distances.get(atKey)!; settled.add(atKey); open.delete(atKey);
    if (!visitedKeys.has(atKey)) { visitedKeys.add(atKey); visited.push(at); events.push({ kind: 'visit', point: at, message: `${forward ? 'Forward' : 'Backward'} Dijkstra settles (${at.row + 1}, ${at.col + 1}) at cost ${currentDistance}.` }); }
    considerMeeting(at);
    for (const q of neighbors(at)) {
      const qKey = keyOf(q), edgeCost = forward ? grid[q.row][q.col].weight : grid[at.row][at.col].weight, nextDistance = currentDistance + edgeCost;
      if (!settled.has(qKey) && nextDistance < (distances.get(qKey) ?? Infinity)) { distances.set(qKey, nextDistance); if (forward) forwardParent.set(qKey, at); else backwardNext.set(qKey, at); heap.push(q, nextDistance); open.add(qKey); }
      considerMeeting(q);
    }
  }
  const path: Point[] = [];
  if (validEndpoints && startKey === endKey) { meeting = start; bestCost = 0; }
  if (meeting) {
    let cursor: Point | undefined = meeting; const prefix = [meeting];
    while (keyOf(cursor) !== startKey) { cursor = forwardParent.get(keyOf(cursor)); if (!cursor) break; prefix.unshift(cursor); }
    cursor = meeting; const suffix: Point[] = [];
    while (cursor && keyOf(cursor) !== endKey) { cursor = backwardNext.get(keyOf(cursor)); if (cursor) suffix.push(cursor); }
    if (keyOf(prefix[0]) === startKey && keyOf(prefix[prefix.length - 1]) === keyOf(meeting) && (keyOf(meeting) === endKey || keyOf(suffix[suffix.length - 1] ?? meeting) === endKey)) path.push(...prefix, ...suffix);
  }
  const found = path.length > 0;
  if (found) for (const point of path) events.push({ kind: 'path', point, message: `Path includes (${point.row + 1}, ${point.col + 1}).` });
  events.push({ kind: 'done', message: found ? 'Both search fronts met. Minimum-cost path reconstructed.' : 'No route exists with the current obstacles.' });
  const pathCost = path.slice(1).reduce((sum, point) => sum + grid[point.row][point.col].weight, 0), frontier = new Map<string, Point>();
  for (const key of [...openForward, ...openBackward]) { const [row, col] = key.split(',').map(Number); frontier.set(key, { row, col }); }
  return { result: { algorithm: 'Bidirectional Dijkstra', found, path, visited, frontier: [...frontier.values()], cost: found ? pathCost : 0, durationMs: performance.now() - begin }, events };
}
export function search(grid: Cell[][], start: Point, end: Point, algorithm: Algorithm): { result: SearchResult; events: SearchEvent[] } {
  if (algorithm === 'Bidirectional Dijkstra') return bidirectionalDijkstra(grid, start, end);
  const begin = performance.now(), rows = grid.length, cols = grid[0]?.length ?? 0;
  const inside = (p: Point) => p.row >= 0 && p.col >= 0 && p.row < rows && p.col < cols;
  const neighbors = (p: Point) => [{ row: p.row - 1, col: p.col }, { row: p.row, col: p.col + 1 }, { row: p.row + 1, col: p.col }, { row: p.row, col: p.col - 1 }].filter(q => inside(q) && !grid[q.row][q.col].wall);
  const visited: Point[] = [], events: SearchEvent[] = [], parent = new Map<string, Point>(), distance = new Map<string, number>([[keyOf(start), 0]]);
  const seen = new Set<string>(), startKey = keyOf(start), endKey = keyOf(end); let found = false;
  const open = new Set<string>([startKey]);
  const relax = (at: Point, q: Point, cost: number) => { const k = keyOf(q), next = (distance.get(keyOf(at)) ?? Infinity) + cost; if (next < (distance.get(k) ?? Infinity)) { distance.set(k, next); parent.set(k, at); open.add(k); return true; } return false; };
  if (inside(start) && inside(end) && !grid[start.row][start.col].wall && !grid[end.row][end.col].wall) {
    if (startKey === endKey) found = true;
    else if (algorithm === 'BFS' || algorithm === 'DFS') {
      const bag: Point[] = [start]; seen.add(startKey);
      while (bag.length && !found) { const at = algorithm === 'BFS' ? bag.shift()! : bag.pop()!; open.delete(keyOf(at)); visited.push(at); events.push({ kind: 'visit', point: at, message: `${algorithm} explores (${at.row + 1}, ${at.col + 1}).` }); if (keyOf(at) === endKey) { found = true; break; } for (const q of neighbors(at)) if (!seen.has(keyOf(q))) { seen.add(keyOf(q)); parent.set(keyOf(q), at); bag.push(q); open.add(keyOf(q)); } }
    } else {
      const heap = new MinHeap<Point>(); heap.push(start, algorithm === 'A*' ? Math.abs(start.row - end.row) + Math.abs(start.col - end.col) : 0);
      while (heap.size && !found) { const item = heap.pop()!, at = item.item, k = keyOf(at); if (seen.has(k)) continue; if (item.priority > (distance.get(k) ?? Infinity) + (algorithm === 'A*' ? Math.abs(at.row - end.row) + Math.abs(at.col - end.col) : 0)) continue; seen.add(k); open.delete(k); visited.push(at); events.push({ kind: 'visit', point: at, message: algorithm === 'A*' ? `A* evaluates f(n) = g(n) + h(n) at (${at.row + 1}, ${at.col + 1}).` : `Dijkstra settles (${at.row + 1}, ${at.col + 1}) at its lowest known cost.` }); if (k === endKey) { found = true; break; } for (const q of neighbors(at)) if (!seen.has(keyOf(q)) && relax(at, q, grid[q.row][q.col].weight)) { const h = algorithm === 'A*' ? Math.abs(q.row - end.row) + Math.abs(q.col - end.col) : 0; heap.push(q, (distance.get(keyOf(q)) ?? Infinity) + h); } }
    }
  }
  const path: Point[] = []; if (found) { let at = end; path.unshift(at); while (keyOf(at) !== startKey) { const prev = parent.get(keyOf(at)); if (!prev) { path.length = 0; found = false; break; } at = prev; path.unshift(at); } }
  if (path.length) for (const p of path) events.push({ kind: 'path', point: p, message: `Path includes (${p.row + 1}, ${p.col + 1}).` });
  events.push({ kind: 'done', message: found ? 'Destination reached. Path reconstructed.' : 'No route exists with the current obstacles.' });
  const pathCost = path.slice(1).reduce((sum, point) => sum + grid[point.row][point.col].weight, 0);
  const result: SearchResult = { algorithm, found, path, visited, frontier: [...open].map(k => { const [row, col] = k.split(',').map(Number); return { row, col }; }), cost: found ? (algorithm === 'Dijkstra' || algorithm === 'A*' ? distance.get(endKey) ?? pathCost : pathCost) : 0, durationMs: performance.now() - begin };
  return { result, events };
}
export const descriptions: Record<Algorithm, { guarantee: string; time: string; space: string; about: string; data: string; pros: string; cons: string }> = {
 BFS: { guarantee: 'Yes, on unweighted grids', time: 'O(V + E)', space: 'O(V)', about: 'Explores all nodes at distance d before distance d+1.', data: 'FIFO queue', pros: 'Simple and shortest by edge count.', cons: 'Can explore a large area; ignores terrain weights.' },
 DFS: { guarantee: 'No', time: 'O(V + E)', space: 'O(V)', about: 'Follows one branch deeply, then backtracks.', data: 'LIFO stack', pros: 'Low overhead and can find a valid route quickly.', cons: 'Route may be much longer than the shortest one.' },
 Dijkstra: { guarantee: 'Yes, for nonnegative weights', time: 'O((V + E) log V)', space: 'O(V)', about: 'Settles the lowest-cost unsettled node first.', data: 'Min-heap priority queue', pros: 'Finds minimum total terrain cost.', cons: 'Explores without goal direction.' },
 'Bidirectional Dijkstra': { guarantee: 'Yes, for nonnegative weights', time: 'O((V + E) log V)', space: 'O(V)', about: 'Runs Dijkstra from both endpoints and joins the fronts at the minimum-cost meeting point.', data: 'Two min-heap priority queues', pros: 'Often explores less by searching from both ends.', cons: 'Needs a known destination and extra bookkeeping.' },
 'A*': { guarantee: 'Yes, with this admissible Manhattan heuristic', time: 'Input dependent; worst case exponential', space: 'O(V)', about: 'Prioritizes f(n) = g(n) + h(n); h estimates remaining distance.', data: 'Min-heap priority queue', pros: 'Heuristic guides search toward the goal.', cons: 'Memory use can be high; performance depends on heuristic.' }
};
