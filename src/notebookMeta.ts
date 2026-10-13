import { CellSnapshot, NotebookMeta } from "./protocol";

export { NotebookMeta };

/** Strip a YAML front matter block from a markdown cell source.
 *  Only applied to non-front-matter-only markdown cells (those that have body content
 *  after the --- block). The host strips before sending to any renderer. */
export function stripFrontMatterSource(source: string): string {
  const m = source.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/);
  return m ? source.slice(m[0].length) : source;
}

/** Returns true if the cell contains only a YAML front matter block with no body.
 *  Accepts both markdown cells and raw cells (language === "raw"), since Quarto
 *  notebooks use a raw cell as the YAML front matter cell. */
export function isFrontMatterOnlyCell(cell: CellSnapshot): boolean {
  if (cell.kind !== "markdown" && cell.language !== "raw") { return false; }
  const src = cell.source;
  if (!src.startsWith("---")) { return false; }
  const afterOpen = src.indexOf("\n");
  if (afterOpen < 0) { return false; }
  const closeIdx = src.indexOf("\n---", afterOpen);
  if (closeIdx < 0) { return false; }
  return src.slice(closeIdx + 4).replace(/^\n/, "").trim() === "";
}

/**
 * Extract document metadata from the YAML front matter of the first markdown or raw cell.
 * All YAML parsing lives here; both preview panels call this when building snapshots.
 */
export function extractNotebookMeta(
  cells: Record<string, CellSnapshot>,
  cellOrder: string[]
): NotebookMeta {
  const firstId = cellOrder[0];
  const firstCell = firstId ? cells[firstId] : undefined;
  if (!firstCell || (firstCell.kind !== "markdown" && firstCell.language !== "raw")) {
    return { echoDefault: true };
  }

  const lines = firstCell.source.split("\n");
  if (lines[0].trim() !== "---") { return { echoDefault: true }; }

  const closeIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (closeIdx < 0) { return { echoDefault: true }; }

  const kv: Record<string, string> = {};
  for (const line of lines.slice(1, closeIdx)) {
    const m = line.match(/^([\w-]+)\s*:\s*(.+)$/);
    if (m) { kv[m[1].toLowerCase().trim()] = m[2].replace(/^["']|["']$/g, "").trim(); }
  }

  const echoVal = (kv["echo"] ?? "").toLowerCase();
  return {
    // Show source by default in the HTML preview; explicit YAML echo: false/off hides it.
    echoDefault: echoVal !== "false" && echoVal !== "off",
    title:       kv["title"],
    author:      kv["author"],
    affiliation: kv["affiliation"],
    date:        kv["date"],
  };
}
