# PathFinder AI — Interactive Pathfinding & Route Intelligence Lab

A React + Vite + TypeScript AOA mini-project with a grid search visualizer, algorithm comparison, a real road-routing map, and viva practice.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Build with `npm run build`; algorithm unit tests are available with `npm run test`.

## Workspaces

- **Algorithm Lab:** draw walls and weighted cells, move the start and destination markers with the Start and Destination tools, generate a random maze, choose a grid size, and visualize BFS, DFS, Dijkstra, Bidirectional Dijkstra, or A*. Playback supports pause, resume, step, speed adjustment, and reset. Statistics are measured from search computation, excluding animation and rendering.
- **Algorithm Arena:** runs all five searches on a snapshot of the same board and reports path and compute metrics. Browser timings for small cases are noisy; node counts are more stable.
- **Real-World Map:** Leaflet and OpenStreetMap tiles let you place start and destination markers independently. The street-grid search fetches mapped roads and building footprints from public Overpass API instances, rasterizes them into a grid, leaves roads traversable, and blocks buildings and off-road cells. Select BFS, DFS, Dijkstra, Bidirectional Dijkstra, or A*, then step, pause, resume, reset, and adjust animation speed over the map. The OSRM road route, distance, and estimated duration are shown separately. Map tiles, Overpass, and OSRM require network access; public endpoints may be busy or rate-limited. Attribute OpenStreetMap contributors and use its [Overpass API guidance](https://wiki.openstreetmap.org/wiki/Overpass_API) for fair use.
- **Learn & Viva:** complexity, data structures, guarantees, limitations, and revealable exam answers.

## Algorithms

| Algorithm | Data structure | Shortest path guarantee | Time | Space |
| --- | --- | --- | --- | --- |
| BFS | FIFO queue | Yes for unweighted grids | O(V + E) | O(V) |
| DFS | LIFO stack | No | O(V + E) | O(V) |
| Dijkstra | Binary min-heap | Yes for nonnegative weights | O((V + E) log V) | O(V) |
| Bidirectional Dijkstra | Two binary min-heaps | Yes for nonnegative weights | O((V + E) log V) | O(V) |
| A* | Binary min-heap; Manhattan heuristic | Yes with the admissible Manhattan heuristic and nonnegative costs | Input dependent; worst case exponential | O(V) |

V is the number of traversable cells and E the neighbor connections. The grid defaults to four-way movement. Entering each cell costs its weight (ordinary cells cost 1). BFS and DFS optimize reachability/edge count and ignore weights; Dijkstra, Bidirectional Dijkstra, and A* minimize total terrain cost.

## Architecture

- `src/algorithms`: independent search engine, deterministic neighbor and priority tie-breaking, event log generation, and learning references.
- `src/App.tsx`: workspace navigation, grid editing and playback, comparison, map orchestration, and learning/viva views.
- `src/style.css`: responsive dark developer-tool interface with optional light theme.
- `tests/algorithms.test.ts`: correctness tests covering routes, shortest-path assumptions, weights, walls, and start=goal.

## Map provider and limits

Map tiles are provided by OpenStreetMap, street/building geometry by public Overpass API instances, and routing by the OSRM public demo endpoint; no API key is needed. These services require an internet connection. Attribute OpenStreetMap contributors on the map. Public service capacity and availability are limited and not guaranteed for production use; follow the [Overpass API guidance](https://wiki.openstreetmap.org/wiki/Overpass_API), [OSRM project guidance](https://project-osrm.org/), and [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/). Failed requests and timeouts show a retryable status, while the local grid lab remains available.

## Practical demonstration sequence

1. In Algorithm Lab, use the default A* configuration and visualize the open grid.
2. Reset, draw a wall corridor and weighted cells, then run Dijkstra and compare its terrain-aware route with BFS.
3. Open Algorithm Arena and compare all algorithms on the same board. Discuss explored-node counts and why measured milliseconds vary.
4. In Real-World Map, select a preset route and calculate it when online; explain that OSRM uses its own road graph.
5. Open Learn & Viva and reveal answers to explain guarantees, heuristic admissibility, and V/E.
