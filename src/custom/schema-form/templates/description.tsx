import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ayasofyazilim-ui/components/tooltip";
import { DescriptionFieldProps } from "@rjsf/utils";
import { InfoIcon } from "lucide-react";

export function DescriptionFieldTemplate(props: DescriptionFieldProps) {
  const { description, id } = props;
  if (!description) return null;
  return (
    <>
      {/* The description text lives here, carrying the id the field references in
          aria-describedby (see ariaDescribedByIds in base-input-field). Screen
          readers announce it the moment the FIELD is focused — no need to reach
          the icon at all — so removing the icon from the tab order below loses no
          accessibility (it actually gains it: the text was previously only inside
          the tooltip, which isn't in the DOM until opened). */}
      <span id={id} className="sr-only">
        {description}
      </span>
      <Tooltip>
        {/* Purely a sighted-mouse hover affordance. aria-hidden (the sr-only text
            above already conveys it) + tabIndex=-1 keeps it out of the tab order,
            so a Dialog won't autofocus it on open — which is what made Radix
            Tooltip pop up unprompted. Still shows on hover. */}
        <TooltipTrigger
          type="button"
          tabIndex={-1}
          aria-hidden
          className="cursor-help"
        >
          <InfoIcon className="size-3.5 ml-1 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>{description}</TooltipContent>
      </Tooltip>
    </>
  );
}
