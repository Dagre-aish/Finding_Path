export type Point = { row: number; col: number };
export type Cell = Point & { wall: boolean; weight: number };
export type Algorithm = 'BFS' | 'DFS' | 'Dijkstra' | 'A*';
export type SearchResult = { algorithm: Algorithm; found: boolean; path: Point[]; visited: Point[]; frontier: Point[]; cost: number; durationMs: number };
export type SearchEvent = { kind: 'visit' | 'path' | 'done'; point?: Point; message: string };
export const keyOf = (p: Point) => `${p.row},${p.col}`;
