import { Label } from "@repo/ayasofyazilim-ui/components/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ayasofyazilim-ui/components/tooltip";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { InfoIcon } from "lucide-react";
import { JSXElementConstructor, ReactElement } from "react";

export function FieldLabel({
  id,
  className,
  required,
  label,
  description,
}: {
  label: string | undefined;
  id: string | undefined;
  className?: string;
  required?: boolean;
  description?:
    | ReactElement<unknown, string | JSXElementConstructor<any>>
    | string
    | undefined;
}) {
  if (!label) return null;
  return (
    <Label
      data-testid={`${id}_label`}
      htmlFor={id}
      className={cn("flex items-center gap-0 text-nowrap", className)}
    >
      {label}
      {required ? <span className="text-destructive">*</span> : null}
      {description &&
      typeof description === "string" &&
      description.length > 0 ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="size-3.5 ml-1 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>{description}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        description
      )}
    </Label>
  );
}
