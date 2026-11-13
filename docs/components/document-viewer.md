# DocumentViewer

`DocumentViewer` from `@repo/ayasofyazilim-ui/custom/document-viewer` renders one document (PDF, image, Office, text) in a bordered viewer, with a custom PDF renderer (zoom, thumbnails, text search).

## When to use

- Showing a single uploaded or stored document next to a form or results.
- Any PDF preview. PDFs are rendered with pdf.js, which needs a worker file served from somewhere; this component lets the consumer choose where.

## Minimal example

```tsx
import DocumentViewer from "@repo/ayasofyazilim-ui/custom/document-viewer";

export function Preview({ url }: { url: string }) {
  return (
    <DocumentViewer
      document={{ uri: url, fileType: "pdf" }}
      pdfWorkerSrc="/pdf.worker.min.mjs"
    />
  );
}
```

## Props

| Prop           | Type            | Default                       | Notes                                                                         |
| -------------- | --------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| `document`     | `DocumentType`  | required                      | `{ uri, fileType?, fileName?, fileData? }`.                                   |
| `className`    | `string`        | none                          | Merged onto the viewer root.                                                  |
| `renderers`    | `DocRenderer[]` | `[]`                          | Extra `react-doc-viewer` renderers, appended after the built-in ones.         |
| `pdfWorkerSrc` | `string`        | `DEFAULT_PDF_WORKER_SRC` (CDN) | URL of the pdf.js worker file. Applied when the PDF renderer renders, not at import. |

Also exported from the same path:

- `DEFAULT_PDF_WORKER_SRC`: `https://cdn.jsdelivr.net/npm/pdfjs-dist@<pdfjs.version>/build/pdf.worker.min.mjs`.
- `applyPdfWorkerSrc(src?)`: sets `pdfjs.GlobalWorkerOptions.workerSrc` to `src ?? DEFAULT_PDF_WORKER_SRC` and returns the value it set.
- `PdfWorkerSrcProvider` / `usePdfWorkerSrc()`: the context `DocumentViewer` uses to hand `pdfWorkerSrc` to the PDF renderer. Use the provider directly if you render the PDF renderer yourself.

## Serving the worker yourself (strict CSP)

By default the worker is loaded from the jsDelivr CDN. A consumer with a strict Content-Security-Policy (no third-party `script-src` / `worker-src`) serves the worker file itself and passes its URL as `pdfWorkerSrc`:

1. Copy `pdf.worker.min.mjs` from the `pdfjs-dist` package that the library's `react-pdf` uses (`node_modules/pdfjs-dist/build/pdf.worker.min.mjs`) into the consumer's `public/` folder, for example as `public/pdf.worker.min.mjs`.
2. Pass `pdfWorkerSrc="/pdf.worker.min.mjs"`.
3. Allow `worker-src 'self'` (and `script-src 'self'`) in the CSP.

## Common mistakes

- **Version mismatch.** The worker file must match `pdfjs.version` of the library's `react-pdf` (pdfjs-dist 5.4.296 today). pdf.js refuses to run when the API and worker versions differ. Update the copied file whenever the library's `react-pdf` is bumped.
- **Relying on import side effects.** Importing the renderer no longer sets the worker; it is set when a PDF is rendered. Code that read `pdfjs.GlobalWorkerOptions.workerSrc` right after import now sees the pdf.js default until a PDF renders.
- **Different `pdfWorkerSrc` on several viewers.** pdf.js has one global worker setting; the last PDF renderer to render wins. Use one URL per page.
