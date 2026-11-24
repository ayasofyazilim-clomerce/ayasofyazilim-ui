"use client";

import { DocRenderer, arrayBufferFileLoader } from "react-doc-viewer";
import { DocxPreview } from "../../docx-preview";

/**
 * Opt-in Word renderer. Pass it through `DocumentViewer`'s `renderers` prop;
 * it is never part of the default list.
 */
export const DocxRenderer: DocRenderer = ({ mainState }) => {
  const data = mainState.currentDocument?.fileData;
  if (!(data instanceof ArrayBuffer)) return null;
  return <DocxPreview file={data} />;
};

DocxRenderer.fileTypes = [
  "docx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
DocxRenderer.weight = 1;
DocxRenderer.fileLoader = arrayBufferFileLoader;
