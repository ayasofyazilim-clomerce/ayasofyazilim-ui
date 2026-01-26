import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
  CellContext,
} from "@tanstack/react-table";
import type { Localization } from "../date-tooltip";
import type { LucideIcon } from "lucide-react";
import { GenericObjectType } from "@rjsf/utils";
import { z } from "@repo/ayasofyazilim-ui/lib/zod";

export type { Localization };

export interface JSONSchemaProperty {
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";
  format?:
    | "int32"
    | "date"
    | "date-time"
    | "email"
    | "uri"
    | "url"
    | "uuid"
    | "time"
    | "badge";
  enum?: Array<string | number>;
  title?: string;
  description?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  default?: unknown;
  readOnly?: boolean;
}

export interface JSONSchema {
  type: "object";
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  title?: string;
  description?: string;
}

export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "between"
  | "inRange"
  | "before"
  | "after"
  | "inList"
  | "notInList";

export interface ColumnFilter {
  id: string;
  operator: FilterOperator;
  value: unknown;
  value2?: unknown;
}

export interface CellEditConfig<TData = unknown> {
  enabled?: boolean;
  mode?: "cell" | "row";
  errorDisplayMode?: "tooltip" | "inline" | "both";
  onRowSave?: (row: TData, changes: Partial<TData>) => void | Promise<void>;
  onRowCancel?: (row: TData) => void;
  isRowEditable?: (row: TData) => boolean;
  isColumnEditable?: (columnId: string, row: TData) => boolean;
}

export interface RowAction<TData = unknown> {
  id: string;
  label: string | ((row: TData) => string);
  icon?: LucideIcon;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  onClick?: (row: TData, event: React.MouseEvent) => void | Promise<void>;
  disabled?: boolean | ((row: TData) => boolean);
  hidden?: boolean | ((row: TData) => boolean);
  className?: string;
}

export interface TableAction<TData = unknown> {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  onClick?: (selectedRows: TData[]) => void | Promise<void>;
  disabled?: boolean | ((selectedRows: TData[]) => boolean);
  hidden?: boolean | ((selectedRows: TData[]) => boolean);
  requiresSelection?: boolean;
  className?: string;
}

export interface RowExpansionConfig<TData = unknown> {
  enabled?: boolean;
  component?: React.ComponentType<{ row: TData }>;
  renderContent?: (row: TData) => React.ReactNode;
  defaultExpanded?: boolean;
  expandOnClick?: string | string[];
}

export interface ColumnMeta {
  schemaProperty?: JSONSchemaProperty;
  filterOperators?: FilterOperator[];
  [key: string]: unknown;
}

export interface ColumnConfig<TData = unknown> {
  id: string;
  header?: string | ((info: { column: Column<TData> }) => React.ReactNode);
  extendHeader?: boolean;
  accessorKey?: string;
  accessorFn?: (row: TData) => unknown;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableGrouping?: boolean;
  enablePinning?: boolean;
  enableResizing?: boolean;
  enableHiding?: boolean;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  cell?: (info: {
    getValue: () => unknown;
    row: Row<TData>;
  }) => React.ReactNode;
  footer?: (info: { column: { id: string } }) => React.ReactNode;
  meta?: ColumnMeta;
  expandOnClick?: boolean;
}

export interface GroupingConfig {
  enabled?: boolean;
  groupBy?: string[];
  expanded?: Record<string, boolean>;
}

export interface VirtualizationConfig {
  enabled?: boolean;
  estimateSize?: number;
  overscan?: number;
}

export interface SelectionConfig<TData = unknown> {
  enabled?: boolean;
  mode?: "single" | "multiple";
  onSelectionChange?: (selectedRows: TData[]) => void;
  rowSelectable?: (row: TData) => boolean;
}

export interface PinningConfig {
  left?: string[];
  right?: string[];
}

export interface ExportConfig<TData = unknown> {
  enabled?: boolean;
  formats?: Array<"csv" | "excel" | "json" | "pdf">;
  filename?: string;
  customExport?: (data: TData[], format: string) => void | Promise<void>;
}

interface BaseServerFilterConfig {
  key: string;
  label: string;
  placeholder: string;
}

interface StringServerFilterConfig extends BaseServerFilterConfig {
  type: "string";
  validator?: z.ZodType<string | undefined>;
}

interface NumberServerFilterConfig extends BaseServerFilterConfig {
  type: "number";
  validator?: z.ZodType<number | undefined>;
}

interface SelectServerFilterConfig extends BaseServerFilterConfig {
  type: "select";
  options: { label: string; value: string }[];
  validator?: z.ZodType<string | undefined>;
}

interface ArrayServerFilterConfig extends BaseServerFilterConfig {
  type: "array";
  options: { label: string; value: string }[];
  validator?: z.ZodType<string[] | undefined>;
}

interface BooleanServerFilterConfig extends BaseServerFilterConfig {
  type: "boolean";
  options: { label: string; value: string }[];
  validator?: z.ZodType<boolean | undefined>;
}

export type ServerFilterConfig =
  | StringServerFilterConfig
  | NumberServerFilterConfig
  | SelectServerFilterConfig
  | ArrayServerFilterConfig
  | BooleanServerFilterConfig;

export interface MasterDataGridConfig<TData = unknown> {
  schema?: JSONSchema | GenericObjectType;
  columns?: ColumnConfig<TData>[];

  t?: MasterDataGridResources;

  serverFilters?: ServerFilterConfig[];
  serverFilterLocation?: "left" | "right" | "top" | "bottom" | "toolbar";
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableGrouping?: boolean;
  enablePinning?: boolean;
  enableResizing?: boolean;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  enableVirtualization?: boolean;
  enableExport?: boolean;

  selection?: SelectionConfig<TData>;
  virtualization?: VirtualizationConfig;
  grouping?: GroupingConfig;
  pinning?: PinningConfig;
  editing?: CellEditConfig<TData>;
  expansion?: RowExpansionConfig<TData>;
  export?: ExportConfig<TData>;

  rowActions?: RowAction<TData>[];
  tableActions?: TableAction<TData>[];

  className?: string;
  containerClassName?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string | ((row: TData) => string);
  cellClassName?: string | ((cell: { row: TData; columnId: string }) => string);

  enablePagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;

  dateOptions?: Intl.DateTimeFormatOptions;
  localization: Localization;

  customRenderers?: CustomRenderers<TData>;

  columnVisibility?: {
    mode: "show" | "hide";
    columns: Array<keyof TData>;
  };
  columnOrder?: Array<keyof TData>;

  enableMultiSort?: boolean;
  enableMultiFilter?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  manualPagination?: boolean;
  rowCount?: number;
  onSortingChange?: (sorting: SortingState) => void;
  onFilteringChange?: (filters: ColumnFiltersState) => void;
  onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  onRefresh?: () => void;

  getRowId?: (row: TData, index: number) => string;
}

export interface MasterDataGridProps<TData = unknown> {
  data: TData[];
  config: MasterDataGridConfig<TData>;
  onDataChange?: (data: TData[]) => void;
}

export interface TableState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  rowSelection: RowSelectionState;
  columnPinning: ColumnPinningState;
  grouping: string[];
  expanded: Record<string, boolean> | true;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  editingRows?: Record<string, Record<string, unknown>>;
}

export interface FilterDialogState {
  open: boolean;
  columnId: string | null;
  currentFilter?: ColumnFilter;
}

export interface CustomCellRendererProps<TData = unknown> {
  value: unknown;
  row: Row<TData>;
  column: Column<TData>;
  onUpdate?: (value: unknown) => void;
  error?: string;
  schemaProperty?: JSONSchemaProperty;
  t?: MasterDataGridResources;
}

export type CustomCellRenderer<TData = unknown> = (
  props: CustomCellRendererProps<TData>
) => React.ReactNode;

export type CustomRenderers<TData> = Partial<
  Record<keyof TData & string, CustomCellRenderer<TData>>
>;

export type GeneratedColumn<TData = unknown> = ColumnDef<TData> & {
  meta?: {
    schemaProperty?: JSONSchemaProperty;
    filterOperators?: FilterOperator[];
    [key: string]: unknown;
  };
};

export type CellProps<TData = unknown, TValue = unknown> = CellContext<
  TData,
  TValue
>;

export interface ExpandableColumnMeta extends ColumnMeta {
  expandOnClick?: boolean;
}

export interface ExportColumnDef<TData = unknown> {
  accessorKey?: string;
  accessorFn?: (row: TData, index: number) => unknown;
  header?: string | ((info: any) => React.ReactNode);
  id?: string;
  meta?: ColumnMeta;
}

export interface CellRendererProps<TData = unknown> {
  value: unknown;
  row: Row<TData>;
  column: Column<TData>;
  columnId: string;
  schemaProperty?: JSONSchemaProperty;
  onUpdate?: (value: unknown) => void;
  isEditing: boolean;
  editable?: boolean;
  error?: string;
  t?: MasterDataGridResources;
  errorDisplayMode?: "tooltip" | "inline" | "both";
  className?: string;
  dateOptions?: Intl.DateTimeFormatOptions;
  localization?: any;
  fieldName?: keyof TData & string;
  customRenderers?: CustomRenderers<TData>;
}

export interface MasterDataGridResources extends Record<string, string> {
  "toolbar.search": string;
  "toolbar.filters": string;
  "toolbar.client": string;
  "toolbar.server": string;
  "toolbar.columns": string;
  "toolbar.export": string;
  "toolbar.refresh": string;
  "toolbar.reset": string;
  "toolbar.selected": string;
  "toolbar.actions": string;

  "pagination.rowsPerPage": string;
  "pagination.page": string;
  "pagination.of": string;
  "pagination.rowsSelected": string;
  "pagination.firstPage": string;
  "pagination.previousPage": string;
  "pagination.nextPage": string;
  "pagination.lastPage": string;

  "column.sortAsc": string;
  "column.sortDesc": string;
  "column.pinLeft": string;
  "column.pinRight": string;
  "column.unpin": string;
  "column.filter": string;
  "column.resetSize": string;
  "column.hide": string;
  "column.edit": string;
  "column.actions": string;
  "column.openMenu": string;

  "filter.title": string;
  "filter.description": string;
  "filter.where": string;
  "filter.and": string;
  "filter.selectColumn": string;
  "filter.operator": string;
  "filter.operator.equals": string;
  "filter.operator.notEquals": string;
  "filter.operator.contains": string;
  "filter.operator.notContains": string;
  "filter.operator.startsWith": string;
  "filter.operator.endsWith": string;
  "filter.operator.isEmpty": string;
  "filter.operator.isNotEmpty": string;
  "filter.operator.greaterThan": string;
  "filter.operator.greaterThanOrEqual": string;
  "filter.operator.lessThan": string;
  "filter.operator.lessThanOrEqual": string;
  "filter.operator.between": string;
  "filter.operator.inRange": string;
  "filter.operator.before": string;
  "filter.operator.after": string;
  "filter.operator.inList": string;
  "filter.operator.notInList": string;
  "filter.value": string;
  "filter.value2": string;
  "filter.valuePlaceholder": string;
  "filter.value2Placeholder": string;
  "filter.addFilter": string;
  "filter.resetFilters": string;
  "filter.apply": string;
  "filter.close": string;
  "filter.clear": string;
  "filter.clearFilter": string;
  "filter.true": string;
  "filter.false": string;
  "filter.min": string;
  "filter.max": string;
  "filter.to": string;

  "columnSettings.title": string;
  "columnSettings.description": string;
  "columnSettings.showAll": string;
  "columnSettings.hideAll": string;

  "table.empty": string;
  "table.noResults": string;

  "validation.invalidString": string;
}
