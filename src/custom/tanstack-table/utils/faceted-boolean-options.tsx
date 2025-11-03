import { CheckCircle, XCircle } from "lucide-react";

export const BooleanOptions = {
  options: [
    {
      label: "Yes",
      when: (value: string | number | boolean | Date) => Boolean(value),
      value: "true",
      icon: CheckCircle,
      iconClassName: "text-green-700",
      hideColumnValue: true,
    },
    {
      label: "No",
      when: (value: string | number | boolean | Date) => !value,
      value: "false",
      icon: XCircle,
      iconClassName: "text-red-700",
      hideColumnValue: true,
    },
  ],
};
