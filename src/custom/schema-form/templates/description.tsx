import { DescriptionFieldProps } from "@rjsf/utils";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";

export function DescriptionFieldTemplate(props: DescriptionFieldProps) {
  const { id, description } = props;

  return typeof description === "string" ? (
    <p id={id} className={cn("text-sm text-muted-foreground")}>
      {description}
    </p>
  ) : (
    description
  );
}
