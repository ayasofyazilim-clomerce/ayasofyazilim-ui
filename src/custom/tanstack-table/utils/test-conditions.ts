import { Row } from "@tanstack/react-table";
import { TanstackTableCellCondition } from "../types";

export function testConditions<T>(
  conditions: TanstackTableCellCondition[] | undefined,
  row: Row<T>
) {
  if (!conditions) return true;

  return (
    conditions
      .map((condition) =>
        condition.when(row.getValue(condition.conditionAccessorKey))
      )
      .filter((i) => !i).length === 0
  );
}
