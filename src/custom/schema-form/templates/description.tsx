import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@repo/ayasofyazilim-ui/components/tooltip";
import { DescriptionFieldProps } from "@rjsf/utils";
import { InfoIcon, MessageCircleQuestion } from "lucide-react";

export function DescriptionFieldTemplate(props: DescriptionFieldProps) {
  const { description, id } = props;
  if (!description) return null;
  return (
    <Tooltip>
      <TooltipTrigger id={id} type="button">
        <InfoIcon className="size-3.5 ml-1 text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  );
}
