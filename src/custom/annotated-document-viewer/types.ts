/**
 * A box's two opposite corners. Page fractions (0–1, origin top-left) unless the box has a
 * `frame`, in which case they are pixels of that frame. The corners may come in any order.
 */
export type AnnotationRect = readonly [
  x0: number,
  y0: number,
  x1: number,
  y1: number,
];

/** One mark drawn over a page. */
export type AnnotationBox = {
  /** Unique across every box passed to the viewer. */
  id: string;
  /** 0-based index into `pages`. Only the current page's boxes are drawn. */
  page: number;
  /** 0–1 page fractions unless `frame` is set. */
  rect: AnnotationRect;
  /**
   * The pixel frame `rect` is measured in. `"natural"` means the page image's natural size; such a
   * box is drawn once the image has decoded.
   */
  frame?: { width: number; height: number } | "natural";
  /**
   * Degrees the page IMAGE is turned counter-clockwise relative to `rect`'s frame (for example, an
   * upright raster of a scan whose boxes were measured on the original upload). Applied after the
   * `frame` division. Any other angle is drawn unrotated.
   */
  rotation?: 0 | 90 | 180 | 270;
  /** Groups boxes (for example by field key) so `activeIds` / `relatedIds` can name them all. */
  group?: string;
  /** Any CSS colour. The box's outline, fill and glow all use it. */
  color?: string;
  /** Shown as the box's native tooltip when the boxes take pointer events. */
  label?: string;
};

/** One page of the document, as an image. */
export type AnnotatedPage = {
  /** Image URL (an object URL or a data URL works too). `null` = not loaded yet. */
  src: string | null;
  /** The image's alt text. Defaults to `labels.pageOf(page, total)`. */
  alt?: string;
};

/** Every user-visible string the viewer and the pager render. */
export type AnnotatedDocumentViewerLabels = {
  previousPage?: string;
  nextPage?: string;
  /** `page` is 1-based. */
  pageOf?: (page: number, total: number) => string;
  zoom?: string;
  zoomIn?: string;
  zoomOut?: string;
  resetZoom?: string;
  loading?: string;
};

export type AnnotatedDocumentViewerProps = {
  /** One entry per page; its length is the page count. */
  pages: AnnotatedPage[];
  /** 0-based index of the page on screen. */
  pageIndex: number;
  onPageChange: (index: number) => void;
  boxes?: AnnotationBox[];
  /** Each entry matches a box `id` or a box `group`; matching boxes are drawn "active". */
  activeIds?: readonly string[];
  /** Same matching; matching boxes are drawn "related" (dashed). Active wins. */
  relatedIds?: readonly string[];
  /** Called with the box under the pointer, then `null` when it leaves. */
  onBoxHover?: (box: AnnotationBox | null) => void;
  /** Called for a click on a box. A click that ends a drag-pan (4 px or more) is ignored. */
  onBoxClick?: (box: AnnotationBox) => void;
  /** Smallest zoom, as a multiple of the fitted page. Default 1. */
  minZoom?: number;
  /** Largest zoom, as a multiple of the fitted page. Default 8. */
  maxZoom?: number;
  /** Overlay a pager on the page. Default true; pass false when you place a `DocumentPager` yourself. */
  pager?: boolean;
  labels?: AnnotatedDocumentViewerLabels;
  className?: string;
  classNames?: {
    root?: string;
    stage?: string;
    page?: string;
    box?: string;
    pager?: string;
    zoom?: string;
  };
};

export type DocumentPagerProps = {
  pageIndex: number;
  pageCount: number;
  onPageChange: (index: number) => void;
  labels?: Pick<AnnotatedDocumentViewerLabels, "previousPage" | "nextPage" | "pageOf">;
  className?: string;
};

/** The English defaults for {@link AnnotatedDocumentViewerLabels}. */
export const DEFAULT_ANNOTATED_DOCUMENT_VIEWER_LABELS: Required<AnnotatedDocumentViewerLabels> =
  {
    previousPage: "Previous page",
    nextPage: "Next page",
    pageOf: (page, total) => `Page ${page} of ${total}`,
    zoom: "Zoom",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetZoom: "Reset zoom",
    loading: "Loading…",
  };
