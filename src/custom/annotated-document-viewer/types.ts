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
  /** The thumbnail strip's `aria-label`. */
  thumbnails?: string;
  /** Each thumbnail button's name; `page` is 1-based. */
  pageN?: (page: number) => string;
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
  /**
   * Show a strip of page thumbnails: vertical beside the page from the `md` breakpoint, horizontal
   * below it under that. Default false (no strip node renders). A thumbnail reuses its page's `src`.
   */
  thumbnails?: boolean;
  /**
   * Called once for a page whose `src` is null when its thumbnail scrolls into view, so a consumer
   * that renders pages on demand can render it. A page that has loaded is never asked for. The
   * request is remembered while the viewer stays mounted: remount it (change its `key`) for a new
   * document.
   */
  onPageNeeded?: (index: number) => void;
  labels?: AnnotatedDocumentViewerLabels;
  className?: string;
  classNames?: {
    root?: string;
    stage?: string;
    page?: string;
    box?: string;
    pager?: string;
    zoom?: string;
    thumbnails?: string;
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
    thumbnails: "Page thumbnails",
    pageN: (page) => `Page ${page}`,
  };
