import type React from "react";
import { z } from "@repo/ayasofyazilim-ui/lib/zod";
import { GenericObjectType } from "@rjsf/utils";
import type {
  CellContext,
  Column,
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import type { Localization } from "../date-tooltip";
import { ButtonVariant } from "@repo/ayasofyazilim-ui/components/button";

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

interface BaseRowAction<TData = unknown> {
  id: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  disabled?: boolean | ((row: TData) => boolean);
  hidden?: boolean | ((row: TData) => boolean);
  className?: string;
}

export interface StandardRowAction<TData = unknown>
  extends BaseRowAction<TData> {
  label: string | ((row: TData) => string);
  icon?: LucideIcon;
  onClick?: (row: TData, event: React.MouseEvent) => void | Promise<void>;
  render?: never;
}

export interface CustomRowAction<TData = unknown> extends BaseRowAction<TData> {
  render: (row: TData) => React.ReactNode;
  onClick?: (row: TData, event: React.MouseEvent) => void | Promise<void>;
  label?: never;
  icon?: never;
}

export interface DialogRowAction<TData = unknown> extends BaseRowAction<TData> {
  type: "dialog";
  dialogType?: "dialog" | "sheet";
  label: string | ((row: TData) => string);
  icon?: LucideIcon;
  title?: string | ((row: TData) => string);
  description?: string | ((row: TData) => string);
  children: (props: {
    row: TData;
    preventClose: boolean;
    setPreventClose: (prevent: boolean) => void;
    close: () => void;
  }) => React.ReactNode;
  preventClose?: boolean;
  contentClassName?: string;
  showCloseButton?: boolean;
}

export type RowAction<TData = unknown> =
  | StandardRowAction<TData>
  | CustomRowAction<TData>
  | DialogRowAction<TData>;

interface BaseTableAction<TData = unknown> {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant?: ButtonVariant;
  disabled?: boolean | ((selectedRows: TData[]) => boolean);
  hidden?: boolean | ((selectedRows: TData[]) => boolean);
  requiresSelection?: boolean;
  className?: string;
}
type LinkTableAction<TData = unknown> = BaseTableAction<TData> & {
  type: "link";
  href: string;
};
type ButtonTableAction<TData = unknown> = BaseTableAction<TData> & {
  type: "button";
  onClick: (selectedRows: TData[]) => void | Promise<void>;
};
type DialogTableAction<TData = unknown> = BaseTableAction<TData> & {
  type: "dialog";
  dialogType?: "dialog" | "sheet";
  title?: string;
  description?: string;
  children: (props: {
    selectedRows: TData[];
    preventClose: boolean;
    setPreventClose: (prevent: boolean) => void;
    close: () => void;
  }) => React.ReactNode;
  preventClose?: boolean;
  contentClassName?: string;
  showCloseButton?: boolean;
};
export type TableAction<TData = unknown> =
  | LinkTableAction<TData>
  | ButtonTableAction<TData>
  | DialogTableAction<TData>;

export interface RowExpansionConfig<TData = unknown> {
  enabled?: boolean;
  renderContent?: (row: TData) => React.ReactNode;
  defaultExpanded?: boolean;
  expanderColumns?: Array<keyof TData> | Array<string>;
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
  isExpanderColumn?: boolean;
}

export interface GroupingConfig {
  enabled?: boolean;
  groupBy?: string[];
  expanded?: Record<string, boolean> | true;
  hideNullGroups?: boolean;
  /** Field on the matched parent row (where row.id === groupingValue) to display as group label */
  groupLabelField?: string;
  /** Hide leaf rows whose `id` appears as a group value (they are already shown as group headers) */
  hideGroupParentRows?: boolean;
  /** Custom renderer for the fallback group header (used when the parent row is not in the current page). `subRows` contains the original data of all child rows — use them to derive labels or any other display fields. */
  groupFallbackRenderer?: (props: {
    groupValue: string;
    subRows: Record<string, unknown>[];
    subRowCount: number;
    isExpanded: boolean;
    toggle: () => void;
  }) => React.ReactNode;
}

export interface VirtualizationConfig {
  enabled?: boolean;
  estimateSize?: number;
  overscan?: number;
}

export interface SelectionConfig<TData = unknown> {
  enabled?: boolean;
  mode?: "single" | "multiple";
  defaultSelectedIds?: string[];
  /** Controlled selection — grid always reflects this array; update it in onSelectionChange to keep in sync */
  selectedIds?: string[];
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
  when?: boolean;
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

interface StringArrayServerFilterConfig extends BaseServerFilterConfig {
  type: "string-array";
  validator?: z.ZodType<string[] | undefined>;
}

interface BooleanServerFilterConfig extends BaseServerFilterConfig {
  type: "boolean";
  options: { label: string; value: boolean }[];
  validator?: z.ZodType<boolean | undefined>;
}

interface DateServerFilterConfig extends BaseServerFilterConfig {
  type: "date";
  validator?: z.ZodType<string | undefined>;
}

interface DateRangeServerFilterConfig extends BaseServerFilterConfig {
  type: "date-range";
  keyFrom: string;
  keyTo: string;
  validator?: z.ZodType<{ from?: string; to?: string } | undefined>;
}

export type ServerFilterConfig =
  | StringServerFilterConfig
  | NumberServerFilterConfig
  | SelectServerFilterConfig
  | ArrayServerFilterConfig
  | StringArrayServerFilterConfig
  | BooleanServerFilterConfig
  | DateServerFilterConfig
  | DateRangeServerFilterConfig;

export interface MasterDataGridConfig<TData = unknown> {
  schema: JSONSchema | GenericObjectType;
  columns?: ColumnConfig<TData>[];

  t?: MasterDataGridResources;

  serverFilters?: ServerFilterConfig[];
  serverFilterLocation?: "left" | "right" | "top" | "bottom" | "toolbar";
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePinning?: boolean;
  enableResizing?: boolean;
  enableColumnVisibility?: boolean;
  enableVirtualization?: boolean;
  enableExport?: boolean;
  enableSearch?: boolean;

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
  schemaColumns?: SchemaColumns<TData>;

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
interface BaseSchemaColumns<T> {
  columns: Array<keyof T & string>;
}
interface IncludeSchemaColumns<T> extends BaseSchemaColumns<T> {
  mode: "include";
  sort?: boolean;
}
interface ExcludeSchemaColumns<T> extends BaseSchemaColumns<T> {
  mode: "exclude";
}
export type SchemaColumns<T> =
  | IncludeSchemaColumns<T>
  | ExcludeSchemaColumns<T>;
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
  isExpanderColumn?: boolean;
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
  "column.save": string;
  "column.cancel": string;
  "column.actions": string;
  "column.openMenu": string;

  "cell.boolean.yes": string;
  "cell.boolean.no": string;

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

  "table.noResults": string;

  "validation.invalidString": string;
}
