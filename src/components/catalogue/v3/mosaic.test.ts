import { describe, expect, it } from "vitest";
import { GRID_COLUMNS, MOSAICS, PANEL_COLUMNS, mosaicFor, place } from "./mosaic";

/** The real groups and how many categories each has today. */
const REAL: Array<[string, number]> = [
  ["baby-care", 13],
  ["feeding", 12],
  ["health-wellness", 7],
  ["sanitary-and-laundry", 6],
  ["nursery", 6],
  ["mum-care", 4],
  ["back-to-school", 9],
  ["swimming-fits-for-toddlers", 4],
  ["clothing", 14],
];

/** Which grid cells the panel and the tiles cover, counting how often each is covered. */
function coverage(slug: string, count: number) {
  const plan = mosaicFor(slug, count)!;
  const cells = new Map<string, number>();
  const cover = (column: number, span: number, row: number, rows = 1) => {
    for (let c = column; c < column + span; c++)
      for (let r = row; r < row + rows; r++) cells.set(`${r}:${c}`, (cells.get(`${r}:${c}`) ?? 0) + 1);
  };
  cover(plan.side === "left" ? 1 : GRID_COLUMNS - PANEL_COLUMNS + 1, PANEL_COLUMNS, 1, plan.panelRows);
  for (const t of plan.tiles) cover(t.column, t.span, t.row);
  const rows = Math.max(...plan.tiles.map((t) => t.row), plan.panelRows);
  return { plan, cells, rows };
}

describe.each(REAL)("the %s mosaic (%i categories)", (slug, count) => {
  it("has a tile for every category", () => {
    expect(mosaicFor(slug, count)!.tiles).toHaveLength(count);
  });

  it("covers every cell exactly once: no gaps and no overlaps", () => {
    const { cells, rows } = coverage(slug, count);

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= GRID_COLUMNS; c++) {
        expect(cells.get(`${r}:${c}`), `row ${r}, column ${c}`).toBe(1);
      }
    }
  });

  it("keeps every tile inside the six columns", () => {
    for (const t of mosaicFor(slug, count)!.tiles) {
      expect(t.column).toBeGreaterThanOrEqual(1);
      expect(t.column + t.span - 1).toBeLessThanOrEqual(GRID_COLUMNS);
    }
  });
});

describe("when the layout no longer fits", () => {
  it("is not used if a category was added", () => {
    expect(mosaicFor("feeding", 13)).toBeNull();
  });

  it("is not used if a category was removed", () => {
    expect(mosaicFor("feeding", 11)).toBeNull();
  });

  it("is not used for a group it knows nothing about", () => {
    expect(mosaicFor("toys", 8)).toBeNull();
  });
});

describe("placing tiles", () => {
  it("starts tiles after a left panel and at the edge beside a right one", () => {
    expect(place({ side: "left", panelRows: 2, entries: [[0, 1, 1]] })[0].column).toBe(3);
    expect(place({ side: "right", panelRows: 2, entries: [[0, 1, 1]] })[0].column).toBe(1);
  });

  it("counts a full-width row across the whole grid", () => {
    expect(place({ side: "left", panelRows: 2, entries: [[1, 3, 3, 1]] })[0]).toEqual({ column: 1, span: 3, row: 3 });
  });

  it("covers the same groups the design does, panels alternating left and right", () => {
    expect(Object.keys(MOSAICS)).toHaveLength(9);
    expect(MOSAICS["baby-care"].side).toBe("left");
    expect(MOSAICS["feeding"].side).toBe("right");
    expect(MOSAICS["baby-care"].panelRows).toBe(3);
    expect(MOSAICS["clothing"].panelRows).toBe(3);
  });
});
