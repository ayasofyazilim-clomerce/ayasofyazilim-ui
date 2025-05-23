import {
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  SearchIcon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

export function Controllers({
  documentUri,
  zoom,
  setZoom,
  showThumbnail,
  setShowThumbnail,
  searchValue,
  setSearchValue,
}: {
  documentUri: string;
  zoom: number;
  setZoom: (zoom: number) => void;
  showThumbnail?: boolean;
  setShowThumbnail?: (show: boolean) => void;
  searchValue?: string;
  setSearchValue?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) {
      if (setSearchValue) {
        setSearchValue('');
      }
    }
  }, [open]);

  return (
    <div className="absolute top-4 right-6 flex gap-2 z-10 flex-col">
      {setShowThumbnail && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowThumbnail(!showThumbnail)}
        >
          {showThumbnail ? (
            <EyeIcon className="size-4" />
          ) : (
            <EyeOffIcon className="size-4" />
          )}
        </Button>
      )}
      <Button variant="outline" size="icon" onClick={() => setZoom(zoom - 0.1)}>
        <ZoomOut className="size-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={() => setZoom(zoom + 0.1)}>
        <ZoomIn className="size-4" />
      </Button>
      <Button asChild variant="outline" size="icon">
        <Link href={documentUri} download target="_blank">
          <DownloadIcon className="size-4" />
        </Link>
      </Button>
      {setSearchValue && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpen(!open)}
            >
              <SearchIcon className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" side="left">
            <div className="grid gap-4">
              <Input
                id="search"
                defaultValue={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                }}
                className="col-span-2 h-8"
              />
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
