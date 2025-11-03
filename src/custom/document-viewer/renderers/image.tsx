import { useState } from "react";
import { DocRendererProps } from "react-doc-viewer";
import { Controllers } from "../controllers";
import ImageCanvas from "../../image-canvas";

const CustomImageRenderer = (props: DocRendererProps) => {
  const { mainState } = props;
  const { currentDocument } = mainState;
  if (!currentDocument) return null;
  const [zoom, setZoom] = useState(1);
  return (
    <div className="flex w-full items-center justify-center p-4">
      <Controllers
        documentUri={currentDocument.uri}
        zoom={zoom}
        setZoom={setZoom}
      />
      <div className="relative size-full flex items-center justify-center">
        <ImageCanvas
          classNames={{
            canvas: "border rounded-md",
          }}
          imageUrl={currentDocument.uri}
          zoom={zoom}
          minZoom={0.5}
          maxZoom={2}
          onZoomChange={setZoom}
        />
      </div>
    </div>
  );
};

CustomImageRenderer.fileTypes = ["image/jpeg", "image/png", "image/gif"];
CustomImageRenderer.weight = 1;

export default CustomImageRenderer;
