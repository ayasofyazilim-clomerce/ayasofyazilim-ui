import { useMemo, useState } from 'react';
import { DocRenderer, DocRendererProps } from 'react-doc-viewer';
import { Document, Page, pdfjs, Thumbnail } from 'react-pdf';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Controllers } from '../controllers';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs`;
type CustomDocRendererProps = {} & DocRendererProps;

const CustomPDFRenderer = (props: CustomDocRendererProps) => {
  const { mainState } = props;
  const { currentDocument } = mainState;
  if (!currentDocument) return null;
  const [zoom, setZoom] = useState(1);
  const [showThumbnail, setShowThumbnail] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [searchValue, setSearchValue] = useState<string>();

  return (
    <Document
      className={cn('p-4 w-full flex')}
      file={currentDocument.uri}
      renderMode="canvas"
      onLoadSuccess={({ numPages }) => {
        setPageCount(numPages);
      }}
    >
      <Controllers
        documentUri={currentDocument.uri}
        zoom={zoom}
        setZoom={setZoom}
        showThumbnail={showThumbnail}
        setShowThumbnail={setShowThumbnail}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
      />

      <div className="flex gap-2 w-full justify-center">
        {showThumbnail && (
          <div className="flex flex-col gap-2 left-4 absolute top-4 z-10 w-full max-w-[110px]">
            {Array.from(new Array(pageCount), (el, index) => (
              <Thumbnail
                onClick={() => {
                  setActivePage(index + 1);
                }}
                className={cn(
                  'rounded-md border bg-white p-1 flex justify-center',
                  activePage === index + 1 && 'border-primary'
                )}
                pageNumber={index + 1}
                width={100}
                height={100}
              />
            ))}
          </div>
        )}
        <div className={cn('flex flex-col', showThumbnail && '')}>
          {Array.from(new Array(pageCount), (el, index) => (
            <Page
              customTextRenderer={({ str }) =>
                searchValue
                  ? str.replace(
                      new RegExp(searchValue, 'gi'),
                      (value) => `<mark>${value}</mark>`
                    )
                  : str
              }
              className="border shadow-sm max-w-max overflow-hidden rounded-md mb-2"
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              scale={zoom}
            />
          ))}
        </div>
      </div>
    </Document>
  );
};

CustomPDFRenderer.fileTypes = ['pdf', 'application/pdf'];
CustomPDFRenderer.weight = 1;

export default CustomPDFRenderer;

export const ExtendCustomPDFRenderer = ({
  searchValue,
}: {
  searchValue?: string;
}): DocRenderer => {
  const Renderer = useMemo(() => {
    function RendererComponent(props: DocRendererProps) {
      return <CustomPDFRenderer {...props} />;
    }
    RendererComponent.fileTypes = ['pdf', 'application/pdf'];
    RendererComponent.weight = 1;
    return RendererComponent;
  }, [searchValue]);

  return Renderer;
};
