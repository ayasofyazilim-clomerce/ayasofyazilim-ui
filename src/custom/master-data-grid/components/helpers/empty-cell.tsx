import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { Minus } from "lucide-react";

export function EmptyCell({ className }: { className?: string }) {
  return (
    <Minus
      className={cn("mx-auto size-4 text-muted-foreground/60", className)}
    />
  );
}
