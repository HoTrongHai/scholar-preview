export type CellKind = "markdown" | "code";

/** Parsed YAML front matter fields from the first markdown cell. */
export interface NotebookMeta {
  echoDefault: boolean;
  title?: string;
  author?: string;
  affiliation?: string;
  date?: string;
}

export interface CellSnapshot {
  id: string;
  kind: CellKind;
  language: string;
  source: string;
  outputs: OutputSnapshot[];
  /** True when this markdown cell contains only YAML front matter (no body text). */
  frontMatterOnly?: boolean;
}

export interface OutputSnapshot {
  mime: string;
  text?: string;
  dataUri?: string;
}

export interface NotebookSnapshot {
  docVersion: number;
  activeCellId?: string;
  cellOrder: string[];
  cells: Record<string, CellSnapshot>;
  /** Document-level metadata derived from YAML front matter of the first markdown cell. */
  notebookMeta: NotebookMeta;
}

export type PatchOp =
  | {
      type: "insertCells";
      at: number;
      cells: CellSnapshot[];
    }
  | {
      type: "deleteCells";
      ids: string[];
    }
  | {
      type: "moveCells";
      ids: string[];
      to: number;
    }
  | {
      type: "recordCellSnapshot";
      id: string;
      cell: CellSnapshot;
    }
  | {
      type: "setActiveCell";
      id?: string;
    };

export type HostToWebviewMessage =
  | {
      type: "fullSync";
      snapshot: NotebookSnapshot;
      notebookDir: string;
    }
  | {
      type: "patch";
      baseVersion: number;
      docVersion: number;
      ops: PatchOp[];
      /** Updated notebook meta, sent whenever the first cell changes. */
      notebookMeta?: NotebookMeta;
    }
  | {
      type: "status";
      text: string;
    }
  | {
      type: "setConfig";
      followActiveCell: boolean;
    }
  | {
      type: "bibData";
      results: Record<string, { cite: string; linkLabel: string }>; // cite key → {authors+title, journal/id link label}
    };

export type WebviewToHostMessage =
  | {
      type: "requestFullSync";
    }
  | {
      type: "focusCell";
      id: string;
    }
  | {
      type: "toggleFollowActiveCell";
    }
  | {
      type: "ack";
      docVersion: number;
    }
  | {
      type: "openInBrowser";
      renderedHtml: string;
    }
  | {
      type: "fetchBib";
      keys: string[]; // cite keys like "doi:10.xxx" or "arxiv:1234.5678"
    };
