import { createContext, useContext } from "react";

/**
 * `ui:options.rowClassName(item, index)` on a table-mode array. The item
 * template is handed no item data, so the array template, which has the whole
 * array, resolves each row's class and passes it down by index.
 */
export type RowClassName = (item: unknown, index: number) => string | undefined;

export const RowClassNameContext = createContext<
  ((index: number) => string | undefined) | undefined
>(undefined);

export function useRowClassName(index: number) {
  return useContext(RowClassNameContext)?.(index);
}
