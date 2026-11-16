# DocxPreview

`DocxPreview` from `@repo/ayasofyazilim-ui/custom/docx-preview` renders a Word (`.docx`) file as HTML in the browser, scaled to the container width. Nothing is uploaded: the file is read and rendered client-side with `docx-preview`, which is loaded lazily the first time a preview mounts.

## When to use

- Previewing a `.docx` the user just picked, before it is sent anywhere.
- A reflow-only preview. There is no box overlay and no pagination control; for evidence boxes use `AnnotatedDocumentViewer` with page images.
- Inside `DocumentViewer`, through the opt-in `DocxRenderer` (below). The default `DocumentViewer` renderers stay as they are: its built-in Office renderer sends the document URL to a third party, which `DocxRenderer` does not.

## Minimal example

```tsx
"use client";

import { DocxPreview } from "@repo/ayasofyazilim-ui/custom/docx-preview";

export function WordPreview({ file }: { file: File }) {
  return <DocxPreview file={file} onError={(e) => console.error(e)} />;
}
```

## Props

| Prop        | Type                                   | Default   | Notes                                                                                   |
| ----------- | -------------------------------------- | --------- | --------------------------------------------------------------------------------------- |
| `file`      | `Blob \| ArrayBuffer`                   | required  | A `File` is a `Blob`. A new value cancels a render still in flight.                     |
| `fit`       | `"width" \| "none"`                     | `"width"` | `"width"` scales the page down to the container width (never above 1:1) and refits on resize. |
| `labels`    | `{ loading?: string; error?: string }` | English   | Defaults: "Rendering preview…" and "This document could not be previewed.".             |
| `onError`   | `(error: unknown) => void`             | none      | Called when the file cannot be rendered (corrupt, or not a `.docx`).                    |
| `className` | `string`                               | none      | Merged onto the scrolling container.                                                    |

## Layout

The component sets the docx wrapper to hug the page's natural width (no CSS needed from the consumer) and renders into a hidden, attached staging node so tab stops and page breaks are measured correctly.

## Status

The component moves through `loading`, `ready` or `error` (exposed as `data-status` on the container). A render that finishes after `file` changed is discarded, so only the newest file's output is shown.

## Opt-in DocumentViewer renderer

```tsx
import DocumentViewer, { DocxRenderer } from "@repo/ayasofyazilim-ui/custom/document-viewer";

<DocumentViewer document={{ uri: url, fileType: "docx" }} renderers={[DocxRenderer]} />;
```

`DocxRenderer` has weight 1 and handles `docx` and `application/vnd.openxmlformats-officedocument.wordprocessingml.document`. It loads the file as an `ArrayBuffer` and renders `DocxPreview` with its default labels. It is exported but never added to the default list.

## CSP

`docx-preview` needs `style-src 'unsafe-inline'`, `img-src data:` and `font-src data:` (images are embedded as data URIs), plus `frame-src 'self'` for embedded HTML chunks.

## Common mistakes

- **Legacy `.doc`, `.pptx`, `.xlsx`.** Only OOXML Word (`.docx`) renders; anything else shows the error label.
- **Passing a new `Blob` every render.** The effect re-runs on identity change; keep the same `file` object while it is unchanged.
- **Expecting an overlay.** Reflow only.
