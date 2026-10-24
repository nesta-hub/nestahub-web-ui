/**
 * How a group's categories are laid out beside its feature panel on the desktop shop home.
 *
 * The layout is a 6-column grid. The panel takes two columns on one side and a few rows;
 * tiles fill the rest, some of them wider than one column so every row comes out full.
 * The placements are hand-tuned for each group's current number of categories. They only
 * apply while the real count still matches: add or remove a category and the group falls
 * back to a plain automatic grid rather than leaving a hole in the mosaic.
 */

export type Side = "left" | "right";

/**
 * One tile: [column, span, row] with the column counted from the first tile column
 * (0-based), or [column, span, row, 1] with the column counted across the whole grid
 * (1-based) for a full-width row below the panel.
 */
export type Entry = [number, number, number] | [number, number, number, 1];

export interface MosaicSpec {
  side: Side;
  /** How many rows the panel is tall. */
  panelRows: number;
  entries: Entry[];
}

export interface Placement {
  /** 1-based grid column the tile starts in. */
  column: number;
  span: number;
  /** 1-based grid row. */
  row: number;
}

export interface MosaicPlan {
  side: Side;
  panelRows: number;
  tiles: Placement[];
}

export const GRID_COLUMNS = 6;
export const PANEL_COLUMNS = 2;

const PAIRS: Entry[] = [
  [0, 2, 1],
  [2, 2, 1],
  [0, 2, 2],
  [2, 2, 2],
];

/** Tiles in rows of four, as many as `count`, starting at `firstRow`. */
const rowsOfFour = (count: number, firstRow: number): Entry[] =>
  Array.from({ length: count }, (_, k): Entry => [k % 4, 1, firstRow + Math.floor(k / 4)]);

/** The nine groups the shop has today, by their real slugs. */
export const MOSAICS: Record<string, MosaicSpec> = {
  // 13: two wide tiles, two rows of four, then three wide tiles across the bottom.
  "baby-care": {
    side: "left",
    panelRows: 3,
    entries: [[0, 2, 1], [2, 2, 1], ...rowsOfFour(8, 2), [1, 2, 4, 1], [3, 2, 4, 1], [5, 2, 4, 1]],
  },
  // 12
  feeding: {
    side: "right",
    panelRows: 2,
    entries: [...rowsOfFour(8, 1), [1, 2, 3, 1], [3, 1, 3, 1], [4, 1, 3, 1], [5, 2, 3, 1]],
  },
  // 7
  "health-wellness": {
    side: "left",
    panelRows: 2,
    entries: [[0, 2, 1], [2, 1, 1], [3, 1, 1], ...rowsOfFour(4, 2)],
  },
  // 6
  "sanitary-and-laundry": {
    side: "right",
    panelRows: 2,
    entries: [[0, 2, 1], [2, 1, 1], [3, 1, 1], [0, 1, 2], [1, 1, 2], [2, 2, 2]],
  },
  // 6
  nursery: {
    side: "left",
    panelRows: 2,
    entries: [[0, 1, 1], [1, 2, 1], [3, 1, 1], [0, 2, 2], [2, 1, 2], [3, 1, 2]],
  },
  // 4
  "mum-care": { side: "right", panelRows: 2, entries: PAIRS },
  // 9
  "back-to-school": {
    side: "left",
    panelRows: 2,
    entries: [[0, 2, 1], [2, 1, 1], [3, 1, 1], ...rowsOfFour(4, 2), [1, 3, 3, 1], [4, 3, 3, 1]],
  },
  // 4
  "swimming-fits-for-toddlers": { side: "right", panelRows: 2, entries: PAIRS },
  // 14: three rows of four, then two wide tiles across the bottom.
  clothing: {
    side: "left",
    panelRows: 3,
    entries: [...rowsOfFour(12, 1), [1, 3, 4, 1], [4, 3, 4, 1]],
  },
};

/** Turn a spec's entries into absolute grid placements. */
export function place(spec: MosaicSpec): Placement[] {
  const firstTileColumn = spec.side === "left" ? PANEL_COLUMNS + 1 : 1;
  return spec.entries.map((entry) => {
    const [col, span, row, absolute] = entry as [number, number, number, 1?];
    return { column: absolute ? col : col + firstTileColumn, span, row };
  });
}

/**
 * The hand-tuned mosaic for a group, or null when there is none for that slug or the group
 * no longer has the number of categories it was tuned for (the caller then uses a plain grid).
 */
export function mosaicFor(slug: string, categoryCount: number): MosaicPlan | null {
  const spec = MOSAICS[slug];
  if (!spec || spec.entries.length !== categoryCount) return null;
  return { side: spec.side, panelRows: spec.panelRows, tiles: place(spec) };
}
