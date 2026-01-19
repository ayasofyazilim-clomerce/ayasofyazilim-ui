import type {
  ColumnFiltersState,
  ColumnPinningState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useReducer } from "react";
import type { MasterDataGridConfig, TableState } from "../types";

/**
 * Actions for table state reducer
 */
type TableStateAction =
  | { type: "SET_SORTING"; payload: SortingState }
  | { type: "SET_COLUMN_FILTERS"; payload: ColumnFiltersState }
  | { type: "SET_COLUMN_VISIBILITY"; payload: VisibilityState }
  | { type: "SET_ROW_SELECTION"; payload: RowSelectionState }
  | { type: "SET_COLUMN_PINNING"; payload: ColumnPinningState }
  | { type: "SET_GROUPING"; payload: string[] }
  | { type: "SET_EXPANDED"; payload: Record<string, boolean> | true }
  | {
      type: "SET_PAGINATION";
      payload: { pageIndex: number; pageSize: number };
    }
  | {
      type: "UPDATE_EDITING_ROWS";
      payload:
        | Record<string, Record<string, unknown>>
        | ((
            prev: Record<string, Record<string, unknown>>
          ) => Record<string, Record<string, unknown>>);
    }
  | { type: "RESET"; payload: TableState };

/**
 * Reducer function for managing complex table state
 */
function tableStateReducer(
  state: TableState,
  action: TableStateAction
): TableState {
  switch (action.type) {
    case "SET_SORTING":
      return { ...state, sorting: action.payload };
    case "SET_COLUMN_FILTERS":
      return { ...state, columnFilters: action.payload };
    case "SET_COLUMN_VISIBILITY":
      return { ...state, columnVisibility: action.payload };
    case "SET_ROW_SELECTION":
      return { ...state, rowSelection: action.payload };
    case "SET_COLUMN_PINNING":
      return { ...state, columnPinning: action.payload };
    case "SET_GROUPING":
      return { ...state, grouping: action.payload };
    case "SET_EXPANDED":
      return { ...state, expanded: action.payload };
    case "SET_PAGINATION":
      return { ...state, pagination: action.payload };
    case "UPDATE_EDITING_ROWS":
      return {
        ...state,
        editingRows:
          typeof action.payload === "function"
            ? action.payload(state.editingRows || {})
            : action.payload,
      };
    case "RESET":
      return action.payload;
    default:
      return state;
  }
}

/**
 * Initialize column visibility based on config
 */
function initializeColumnVisibility<TData>(
  config: MasterDataGridConfig<TData>
): VisibilityState {
  if (!config.columnVisibility) {
    return {};
  }

  if (config.columnVisibility.mode === "hide") {
    // Hide specified columns, show all others
    return Object.fromEntries(
      config.columnVisibility.columns.map((id) => [String(id), false])
    );
  }

  if (config.columnVisibility.mode === "show") {
    // Show only specified columns, hide all others
    // Get all possible column IDs from schema and custom columns
    const allColumnIds: string[] = [
      ...(config.schema ? Object.keys(config.schema.properties || {}) : []),
      ...(config.columns?.map((c) => c.id) || []),
    ];

    // Create visibility map: all false except specified ones
    return Object.fromEntries(
      allColumnIds.map((id) => [
        String(id),
        config.columnVisibility!.columns.map(String).includes(String(id)),
      ])
    );
  }

  return {};
}

/**
 * Create initial table state from config
 */
function createInitialState<TData>(
  config: MasterDataGridConfig<TData>,
  pageSize: number
): TableState {
  return {
    sorting: [],
    columnFilters: [],
    columnVisibility: initializeColumnVisibility(config),
    rowSelection: {},
    columnPinning: config.pinning || {},
    grouping: config.grouping?.groupBy || [],
    expanded: config.grouping?.expanded || {},
    pagination: {
      pageIndex: 0,
      pageSize,
    },
    editingRows: {},
  };
}

/**
 * Hook for managing table state with useReducer
 * Provides cleaner state transitions compared to useState
 */
export function useTableStateReducer<TData>(
  config: MasterDataGridConfig<TData>,
  pageSize: number
) {
  const [tableState, dispatch] = useReducer(tableStateReducer, undefined, () =>
    createInitialState(config, pageSize)
  );

  return {
    tableState,
    setSorting: (payload: SortingState) =>
      dispatch({ type: "SET_SORTING", payload }),
    setColumnFilters: (payload: ColumnFiltersState) =>
      dispatch({ type: "SET_COLUMN_FILTERS", payload }),
    setColumnVisibility: (payload: VisibilityState) =>
      dispatch({ type: "SET_COLUMN_VISIBILITY", payload }),
    setRowSelection: (payload: RowSelectionState) =>
      dispatch({ type: "SET_ROW_SELECTION", payload }),
    setColumnPinning: (payload: ColumnPinningState) =>
      dispatch({ type: "SET_COLUMN_PINNING", payload }),
    setGrouping: (payload: string[]) =>
      dispatch({ type: "SET_GROUPING", payload }),
    setExpanded: (payload: Record<string, boolean> | true) =>
      dispatch({ type: "SET_EXPANDED", payload }),
    setPagination: (payload: { pageIndex: number; pageSize: number }) =>
      dispatch({ type: "SET_PAGINATION", payload }),
    updateEditingRows: (
      payload:
        | Record<string, Record<string, unknown>>
        | ((
            prev: Record<string, Record<string, unknown>>
          ) => Record<string, Record<string, unknown>>)
    ) => dispatch({ type: "UPDATE_EDITING_ROWS", payload }),
    resetToDefaults: () =>
      dispatch({
        type: "RESET",
        payload: createInitialState(config, pageSize),
      }),
  };
}
