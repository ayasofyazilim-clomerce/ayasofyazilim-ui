import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { ArrowRight, LucideIcon } from "lucide-react";
import Link, { LinkProps } from "next/link";

interface BaseRowLinkProps {
  href: string;
  label: string | null | undefined;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
  onClick?: LinkProps["onClick"];
  "data-testid"?: string;
}
interface ConditionalRowLinkProps extends BaseRowLinkProps {
  linkCondition: boolean;
  icon?: never;
}
interface UnconditionalRowLinkProps extends BaseRowLinkProps {
  linkCondition?: never;
  icon?: LucideIcon;
}
type RowLinkProps = ConditionalRowLinkProps | UnconditionalRowLinkProps;

export function RowLink({
  href,
  label,
  className,
  iconClassName,
  icon: Icon = ArrowRight,
  children,
  onClick,
  linkCondition,
  "data-testid": dataTestId,
}: RowLinkProps) {
  if (linkCondition === false) {
    return (
      <div className={cn("inline-flex gap-1 items-center", className)}>
        {label}
        {children}
      </div>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        "text-blue-500 inline-flex gap-1 items-center group/link",
        className
      )}
      onClick={onClick}
      data-testid={dataTestId}
    >
      {label}
      {children}
      {Icon && (
        <span className="w-4 relative inline-flex items-center">
          <Icon
            className={cn(
              "absolute -left-4 w-0 opacity-0 transition-all group-hover/link:opacity-100 group-hover/link:w-4 group-hover/link:left-0",
              iconClassName
            )}
          />
        </span>
      )}
    </Link>
  );
}
