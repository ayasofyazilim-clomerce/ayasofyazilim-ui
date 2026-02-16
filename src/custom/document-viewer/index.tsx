"use client";

import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import DocViewer, { DocRenderer, DocViewerRenderers } from "react-doc-viewer";
import CustomImageRenderer from "./renderers/image";
import CustomPDFRenderer from "./renderers/pdf";

export * from "react-doc-viewer";

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
}: {
  document: DocumentType;
  className?: string;
  renderers?: DocRenderer[];
}) {
  return (
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
  );
}
