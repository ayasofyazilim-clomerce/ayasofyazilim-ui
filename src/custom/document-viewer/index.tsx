"use client";

import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import DocViewer, { DocRenderer, DocViewerRenderers } from "react-doc-viewer";
import CustomImageRenderer from "./renderers/image";
import { PdfWorkerSrcProvider } from "./pdf-worker";
import CustomPDFRenderer from "./renderers/pdf";

export * from "react-doc-viewer";
export {
  applyPdfWorkerSrc,
  DEFAULT_PDF_WORKER_SRC,
  PdfWorkerSrcProvider,
  usePdfWorkerSrc,
} from "./pdf-worker";

export type DocumentType = {
  uri: string;
  fileType?: string;
  fileName?: string;
  fileData?: string | ArrayBuffer;
};
export default function DocumentViewer({
  document,
  className,
  renderers = [],
  pdfWorkerSrc,
}: {
  document: DocumentType;
  className?: string;
  renderers?: DocRenderer[];
  /** URL of the pdf.js worker; defaults to the jsDelivr CDN. Must match the library's pdfjs version. */
  pdfWorkerSrc?: string;
}) {
  return (
    <PdfWorkerSrcProvider value={pdfWorkerSrc}>
      <DocViewer
        config={{
          header: {
            disableHeader: true,
            disableFileName: true,
          },
        }}
        className={cn("h-full rounded-md border relative", className)}
        pluginRenderers={[
          ...DocViewerRenderers,
          CustomPDFRenderer,
          CustomImageRenderer,
          ...renderers,
        ]}
        documents={[document]}
      />
    </PdfWorkerSrcProvider>
  );
}
