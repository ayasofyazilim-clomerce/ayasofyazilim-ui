"use client";

import { FileText, Folder, FolderOpen, Upload, X } from "lucide-react";
import * as React from "react";
import Dropzone, {
  FileWithPath as DefaultFileWithPath,
  DropzoneState,
  type DropzoneProps,
  type FileRejection,
} from "react-dropzone";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ayasofyazilim-ui/components/avatar";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ayasofyazilim-ui/components/collapsible";
import { Progress } from "@repo/ayasofyazilim-ui/components/progress";
import { ScrollArea } from "@repo/ayasofyazilim-ui/components/scroll-area";
import { toast } from "@repo/ayasofyazilim-ui/components/sonner";
import { cn, formatBytes } from "@repo/ayasofyazilim-ui/lib/utils";
import { useControllableState } from "../hooks/use-controllable-state";

export type FileWithPath = DefaultFileWithPath;
export type BaseFileUploaderProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Value of the uploader.
   * @type File[]
   * @default undefined
   * @example value={files}
   */
  value?: DefaultFileWithPath[];

  /**
   * Function to be called when the value changes.
   * @type (files: File[]) => void
   * @default undefined
   * @example onValueChange={(files) => setFiles(files)}
   */
  onValueChange?: (files: DefaultFileWithPath[]) => void;

  /**
   * Function to be called when files are uploaded.
   * @type (files: File[]) => Promise<void>
   * @default undefined
   * @example onUpload={(files) => uploadFiles(files)}
   */
  onUpload?: (files: File[]) => Promise<void>;

  /**
   * Progress of the uploaded files.
   * @type Record<string, number> | undefined
   * @default undefined
   * @example progresses={{ "file1.png": 50 }}
   */
  progresses?: Record<string, number>;

  /**
   * Accepted file types for the uploader.
   * @type { [key: string]: string[]}
   * @default
   * ```ts
   * { "image/*": [] }
   * ```
   * @example accept={["image/png", "image/jpeg"]}
   */
  accept?: DropzoneProps["accept"];

  /**
   * Maximum file size for the uploader.
   * @type number | undefined
   * @default 1024 * 1024 * 2 // 2MB
   * @example maxSize={1024 * 1024 * 2} // 2MB
   */
  maxSize?: DropzoneProps["maxSize"];

  /**
   * Maximum number of files for the uploader.
   * @type number | undefined
   * @default 1
   * @example maxFileCount={4}
   */
  maxFileCount?: DropzoneProps["maxFiles"];

  /**
   * Whether the uploader should accept multiple files.
   * @type boolean
   * @default false
   * @example multiple
   */
  multiple?: boolean;

  /**
   * Whether the uploader is disabled.
   * @type boolean
   * @default false
   * @example disabled
   */
  disabled?: boolean;

  /**
   * Whether the uploader has drag and drop functionality.
   * @type boolean
   * @default false
   * @example noDrag
   */
  label?: string | React.ReactNode;
  description?: string | React.ReactNode;
  classNames?: {
    container?: string;
    collapsible?: string;
    dropzoneContainer?: string;
    dropzone?: string;
    fileList?: string;
    header?: string;
    collapsibleContent?: string;
  };
  showFileList?: boolean;
  fileCardRenderer?: (props: FileCardProps) => React.ReactNode;
} & (ButtonFileUploaderProps | DropzoneFileUploaderProps);

type ButtonFileUploaderProps = {
  variant: "button";
  children?: React.ReactNode;
  headerChildren?: React.ReactNode;
};
type DropzoneFileUploaderProps = {
  variant: "dropzone";
};
export function FileUploader(props: BaseFileUploaderProps) {
  const {
    value: valueProp,
    onValueChange,
    onUpload,
    progresses,
    accept = {
      "image/*": [],
    },
    maxSize = 1024 * 1024 * 2,
    maxFileCount = 1,
    multiple = false,
    disabled = false,
    classNames,
    showFileList = true,
    label,
    description,
    fileCardRenderer,
  } = props;

  const [files, setFiles] = useControllableState({
    prop: valueProp,
    onChange: onValueChange,
  });

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!multiple && maxFileCount === 1 && acceptedFiles.length > 1) {
        toast.error("Cannot upload more than 1 file at a time");
        return;
      }

      if ((files?.length ?? 0) + acceptedFiles.length > maxFileCount) {
        toast.error(`Cannot upload more than ${maxFileCount} files`);
        return;
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );
      if (newFiles.length > 0 && !isOpen) setIsOpen(true);
      const updatedFiles = files ? [...files, ...newFiles] : newFiles;

      setFiles(updatedFiles);

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file, errors }) => {
          toast.error(
            `File ${file.name} was rejected because of ${errors.map((error) => error.message).join(", ")}`
          );
        });
      }

      if (
        onUpload &&
        updatedFiles.length > 0 &&
        updatedFiles.length <= maxFileCount
      ) {
        const target =
          updatedFiles.length > 0 ? `${updatedFiles.length} files` : `file`;

        toast.promise(onUpload(updatedFiles), {
          loading: `Uploading ${target}...`,
          success: () => {
            setFiles([]);
            return `${target} uploaded`;
          },
          error: `Failed to upload ${target}`,
        });
      }
    },

    [files, maxFileCount, multiple, onUpload, setFiles]
  );

  function onRemove(index: number) {
    if (!files) return;
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (newFiles.length === 0) setIsOpen(false);
    onValueChange?.(newFiles);
  }

  // Revoke preview url when component unmounts
  React.useEffect(
    () => () => {
      if (!files) return;
      files.forEach((file) => {
        if (isFileWithPreview(file)) {
          URL.revokeObjectURL(file.preview);
        }
      });
    },
    []
  );

  const isDisabled = disabled || (files?.length ?? 0) >= maxFileCount;
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <Collapsible
      onOpenChange={setIsOpen}
      open={isOpen}
      className={cn(
        "transition-all flex flex-col w-full border rounded-lg [&>h3]:w-full",
        classNames?.collapsible
      )}
    >
      <div
        className={cn(
          " gap-4 p-4",
          props.variant === "button"
            ? "flex flex-col sm:flex-row"
            : "grid grid-cols-12",
          classNames?.container
        )}
      >
        <CollapsibleTrigger
          className={cn(
            "gap-4 group/trigger hover:no-underline",
            !files?.length && "opacity-50"
          )}
          asChild
        >
          <Button
            variant="outline"
            className="gap-2"
            disabled={isDisabled || !files?.length}
          >
            <FolderOpen className="w-4 group-data-[state=open]/trigger:hidden" />
            <Folder className="w-4 group-data-[state=closed]/trigger:hidden" />
            Files
          </Button>
        </CollapsibleTrigger>
        <Dropzone
          onDrop={onDrop}
          accept={accept}
          maxSize={maxSize}
          maxFiles={maxFileCount}
          multiple={maxFileCount > 1 || multiple}
          disabled={isDisabled}
          noDrag={props.variant === "button"}
        >
          {(dropzone) => (
            <DropzoneTrigger {...dropzone} {...props} isDisabled={isDisabled} />
          )}
        </Dropzone>
        <div className={cn("flex w-full", classNames?.header)}>
          <div className="flex flex-col w-full text-nowrap justify-center">
            {label && (
              <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
              </span>
            )}
            {description && (
              <span className="text-muted-foreground text-sm">
                {description}
              </span>
            )}
          </div>
          {props.variant === "button" &&
            props.headerChildren &&
            props.headerChildren}
        </div>
      </div>
      {props.children && props.children}
      <CollapsibleContent
        className={cn("w-full p-0 h-max", classNames?.collapsibleContent)}
      >
        <div
          className={cn(
            "group relative flex flex-col gap-4 overflow-hidden",
            files?.length && props.variant === "button" && "",
            files?.length && files?.length > 0 && "p-4 border-t",
            classNames?.container
          )}
        >
          {files?.length && showFileList !== false ? (
            <ScrollArea className="h-fit w-full">
              <div
                className={cn(
                  "grid max-h-48 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 flex-col gap-4",
                  files.length === 1 && "grid-cols-1!",
                  files.length === 2 && "sm:grid-cols-2!",
                  files.length === 3 && "lg:grid-cols-3!",
                  files.length === 4 && "2xl:grid-cols-4!",
                  classNames?.fileList
                )}
              >
                {files?.map((file, index) => (
                  <React.Fragment
                    key={file.name + file.lastModified + file.path}
                  >
                    {fileCardRenderer ? (
                      fileCardRenderer({
                        file,
                        index,
                        onRemove: () => onRemove(index),
                      })
                    ) : (
                      <FileCard
                        file={file}
                        onRemove={() => onRemove(index)}
                        progress={progresses?.[file.name]}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </ScrollArea>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export interface FileCardProps {
  index: number;
  file: DefaultFileWithPath;
  onRemove?: () => void;
  disabled?: boolean;
  progress?: number;
  classNames?: {
    container?: string;
    removeButton?: string;
  };
}

export function FileCard({
  file,
  progress,
  onRemove,
  disabled,
  classNames,
}: Omit<FileCardProps, "index">) {
  return (
    <div
      className={cn(
        "bg-muted relative flex items-center gap-2.5 overflow-hidden rounded-md p-2",
        classNames?.container
      )}
    >
      <div className="flex flex-1 gap-2.5">
        {isFileWithPreview(file) ? <FilePreview file={file} /> : null}
        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-col gap-px overflow-hidden">
            <p className="text-foreground/80 line-clamp-1 text-sm font-medium max-w-60 text-ellipsis">
              {file.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatBytes(file.size)}
            </p>
          </div>
          {progress ? (
            <Progress value={progress} className="duration-1000" />
          ) : null}
        </div>
      </div>
      {onRemove && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn("size-7", classNames?.removeButton)}
            disabled={!!progress || disabled}
            onClick={onRemove}
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export function isFileWithPreview(
  file: FileWithPath
): file is FileWithPath & { preview: string } {
  return "preview" in file && typeof file.preview === "string";
}

export interface FilePreviewProps {
  file: FileWithPath & { preview: string };
}

export function FilePreview({ file }: FilePreviewProps) {
  if (file.type.startsWith("image/")) {
    return (
      <Avatar className="rounded-md border">
        <AvatarImage
          className="rounded-md"
          src={file.preview}
          alt={file.name}
          loading="lazy"
        />
        <AvatarFallback className="bg-white rounded-md text-xs">
          {`.${file.name.split(".")[1]}`}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <FileText className="text-muted-foreground size-10" aria-hidden="true" />
  );
}

type DropzoneTriggerProps = DropzoneState &
  BaseFileUploaderProps & {
    isDisabled?: boolean;
  };
function DropzoneTrigger(props: DropzoneTriggerProps) {
  const {
    classNames,
    variant,
    getRootProps,
    getInputProps,
    isDragActive = true,
    maxFileCount = 1,
    maxSize = 1024 * 1024 * 2,
    isDisabled,
    // ...dropzoneProps
  } = props;
  if (variant === "button") {
    return (
      <div
        className={cn(
          "flex flex-col sm:flex-row gap-4",
          classNames?.dropzoneContainer
        )}
      >
        <div
          {...getRootProps()}
          // {...dropzoneProps}
          className={cn(
            "relative flex items-center gap-4 rounded-lg",
            classNames?.dropzone
          )}
        >
          <input {...getInputProps()} />
          <Button
            type="button"
            variant="outline"
            className="min-h-9 gap-2 w-full sm:max-w-max"
            disabled={isDisabled}
          >
            <Upload className="size-4" aria-hidden="true" />
            Select
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div
      {...getRootProps()}
      // {...dropzoneProps}
      className={cn(
        "border-muted-foreground/25 hover:bg-muted/25 group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed px-5 py-2.5 text-center transition",
        "ring-offset-background focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDragActive && "border-muted-foreground/50",
        isDisabled && "pointer-events-none opacity-60",
        variant === "dropzone" && "col-span-full row-start-2",
        classNames?.dropzone
      )}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
          <div className="rounded-full border border-dashed p-3">
            <Upload
              className="text-muted-foreground size-7"
              aria-hidden="true"
            />
          </div>
          <p className="text-muted-foreground font-medium">
            Drop the files here
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
          <div className="rounded-full border border-dashed p-3">
            <Upload
              className="text-muted-foreground size-7"
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-col gap-px">
            <p className="text-muted-foreground font-medium">
              Drag{`'n'`} drop files here, or click to select files
            </p>
            <p className="text-muted-foreground/70 text-sm">
              You can upload
              {maxFileCount > 1
                ? ` ${maxFileCount === Infinity ? "multiple" : maxFileCount}
                      files (up to ${formatBytes(maxSize)} each)`
                : ` a file with ${formatBytes(maxSize)}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
