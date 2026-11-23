"use client";

import { createContext, ReactNode, useContext } from "react";
import { pdfjs } from "react-pdf";

/** The CDN worker matching the pdf.js version bundled by the library's `react-pdf`. */
export const DEFAULT_PDF_WORKER_SRC = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/** Points pdf.js at `src` (or the CDN default) and returns the URL it set. */
export function applyPdfWorkerSrc(src?: string): string {
  const workerSrc = src ?? DEFAULT_PDF_WORKER_SRC;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  return workerSrc;
}

const PdfWorkerSrcContext = createContext<string | undefined>(undefined);

export function PdfWorkerSrcProvider({
  value,
  children,
}: {
  value?: string;
  children?: ReactNode;
}) {
  return (
    <PdfWorkerSrcContext.Provider value={value}>
      {children}
    </PdfWorkerSrcContext.Provider>
  );
}

export function usePdfWorkerSrc(): string | undefined {
  return useContext(PdfWorkerSrcContext);
}
