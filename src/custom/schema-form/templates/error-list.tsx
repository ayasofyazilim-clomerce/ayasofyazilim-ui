import { ErrorListProps } from "@rjsf/utils";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@repo/ayasofyazilim-ui/components/alert";

export function ErrorListTemplate(props: ErrorListProps) {
  const { errors } = props;
  return (
    <ul className="space-y-2">
      {errors.map((error) => (
        <li key={error.stack}>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.stack}</AlertDescription>
          </Alert>
        </li>
      ))}
    </ul>
  );
}
