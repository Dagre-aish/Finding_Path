import { describe, expect, it } from 'vitest';
import { nearestOpenCell, rasterizeOSMWays } from '../src/map/osmGrid';
import { search } from '../src/algorithms';

describe('OpenStreetMap street grid', () => {
  const bounds = { north: 0.01, south: 0, east: 0.01, west: 0 };
  it('turns mapped road geometry into traversable cells and keeps off-road cells blocked', () => {
    const grid = rasterizeOSMWays([{ tags: { highway: 'residential' }, geometry: [{ lat: 0.005, lon: 0.001 }, { lat: 0.005, lon: 0.009 }] }], bounds, 20, 20);
    expect(grid.roadCells.size).toBeGreaterThan(0);
    expect(grid.cells[10].some(cell => !cell.wall)).toBe(true);
    expect(grid.cells[0].every(cell => cell.wall)).toBe(true);
  });
  it('marks cells covered by building polygons as walls', () => {
    const grid = rasterizeOSMWays([{ tags: { building: 'yes' }, geometry: [{ lat: .004, lon: .004 }, { lat: .004, lon: .006 }, { lat: .006, lon: .006 }, { lat: .006, lon: .004 }, { lat: .004, lon: .004 }] }], bounds, 20, 20);
    expect(grid.buildingCells.has('10,10')).toBe(true);
    expect(grid.cells[10][10].wall).toBe(true);
  });
  it('snaps endpoint coordinates to the nearest open street cell', () => {
    const grid = rasterizeOSMWays([{ tags: { highway: 'service' }, geometry: [{ lat: .005, lon: .002 }, { lat: .005, lon: .008 }] }], bounds, 20, 20);
    const start = nearestOpenCell(grid, [.009, .002]);
    const end = nearestOpenCell(grid, [.001, .008]);
    expect(start).not.toBeNull(); expect(end).not.toBeNull();
    const result = search(grid.cells, start!, end!, 'A*').result;
    expect(result.found).toBe(true);
    expect(result.path.every(point => !grid.cells[point.row][point.col].wall)).toBe(true);
  });
});
