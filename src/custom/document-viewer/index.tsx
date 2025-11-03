"use client";

import DocViewer, { DocRenderer } from "react-doc-viewer";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import CustomImageRenderer from "./renderers/image";
import CustomPDFRenderer from "./renderers/pdf";

export * from "react-doc-viewer";

export type DocumentType = {
  uri: string;
  fileType?: string;
  fileName?: string;
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
      pluginRenderers={[CustomPDFRenderer, CustomImageRenderer, ...renderers]}
      documents={[document]}
    />
  );
}
