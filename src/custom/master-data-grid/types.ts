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

// Re-export Localization for convenience
export type { Localization };

/**
 * JSON Schema Property Definition
 * Defines the structure and validation rules for a single property
 */
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

/**
 * JSON Schema Definition
 * Complete schema structure for data validation and column generation
 */
export interface JSONSchema {
  type: "object";
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  title?: string;
  description?: string;
}

/**
 * Filter Operators by Data Type
 */
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

/**
 * Column Filter Configuration
 */
export interface ColumnFilter {
  id: string;
  operator: FilterOperator;
  value: unknown;
  value2?: unknown; // For 'between' operator
}

/**
 * Cell Editing Configuration
 */
export interface CellEditConfig<TData = unknown> {
  enabled?: boolean;
  mode?: "cell" | "row"; // cell = save on blur, row = save with button
  errorDisplayMode?: "tooltip" | "inline" | "both"; // How to display validation errors
  onRowSave?: (row: TData, changes: Partial<TData>) => void | Promise<void>;
  onRowCancel?: (row: TData) => void;
  isRowEditable?: (row: TData) => boolean;
  isColumnEditable?: (columnId: string, row: TData) => boolean;
}

/**
 * Row Action Definition
 * Actions displayed in a dropdown menu for each row
 */
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

/**
 * Table Action Definition (Toolbar actions)
 */
export interface TableAction<TData = unknown> {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  onClick?: (selectedRows: TData[]) => void | Promise<void>;
  disabled?: boolean | ((selectedRows: TData[]) => boolean);
  hidden?: boolean | ((selectedRows: TData[]) => boolean);
  requiresSelection?: boolean; // Action only enabled when rows are selected
  className?: string;
}

/**
 * Row Expansion Configuration
 */
export interface RowExpansionConfig<TData = unknown> {
  enabled?: boolean;
  component?: React.ComponentType<{ row: TData }>;
  renderContent?: (row: TData) => React.ReactNode;
  defaultExpanded?: boolean;
  expandOnClick?: string | string[]; // Column ID(s) that trigger expansion when clicked
}

/**
 * Column Meta Data
 */
export interface ColumnMeta {
  schemaProperty?: JSONSchemaProperty;
  filterOperators?: FilterOperator[];
  [key: string]: unknown;
}

/**
 * Column Configuration
 */
export interface ColumnConfig<TData = unknown> {
  id: string;
  header?: string | ((info: { column: Column<TData> }) => React.ReactNode);
  /**
   * When true, preserves the default HeaderCell functionality (sorting, filtering, pinning)
   * even when a custom header function is provided. The custom header will be passed as the label.
   * Default: true (extends default header functionality)
   */
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
  expandOnClick?: boolean; // Whether clicking this column should toggle row expansion
}

/**
 * Grouping Configuration
 */
export interface GroupingConfig {
  enabled?: boolean;
  groupBy?: string[];
  expanded?: Record<string, boolean>;
}

/**
 * Virtualization Configuration
 */
export interface VirtualizationConfig {
  enabled?: boolean;
  estimateSize?: number; // Estimated row height in pixels
  overscan?: number; // Number of items to render outside visible area
}

/**
 * Selection Configuration
 */
export interface SelectionConfig<TData = unknown> {
  enabled?: boolean;
  mode?: "single" | "multiple";
  onSelectionChange?: (selectedRows: TData[]) => void;
  rowSelectable?: (row: TData) => boolean;
}

/**
 * Column Pinning Configuration
 */
export interface PinningConfig {
  left?: string[];
  right?: string[];
}

/**
 * Export Configuration
 */
export interface ExportConfig<TData = unknown> {
  enabled?: boolean;
  formats?: Array<"csv" | "excel" | "json" | "pdf">;
  filename?: string;
  customExport?: (data: TData[], format: string) => void | Promise<void>;
}

/**
 * Master Data Grid Configuration
 */
export interface MasterDataGridConfig<TData = unknown> {
  // Schema
  schema?: JSONSchema;
  columns?: ColumnConfig<TData>[];

  // Translation
  t?: MasterDataGridResources & Record<string, string>;

  // Features
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableGrouping?: boolean;
  enablePinning?: boolean;
  enableResizing?: boolean;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  enableVirtualization?: boolean;
  enableExport?: boolean;

  // Configuration Objects
  selection?: SelectionConfig<TData>;
  virtualization?: VirtualizationConfig;
  grouping?: GroupingConfig;
  pinning?: PinningConfig;
  editing?: CellEditConfig<TData>;
  expansion?: RowExpansionConfig<TData>;
  export?: ExportConfig<TData>;

  // Actions
  rowActions?: RowAction<TData>[];
  tableActions?: TableAction<TData>[];

  // Styling
  className?: string;
  containerClassName?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string | ((row: TData) => string);
  cellClassName?: string | ((cell: { row: TData; columnId: string }) => string);

  // Pagination
  enablePagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  emptyMessage?: string;

  // Date formatting
  dateOptions?: Intl.DateTimeFormatOptions;
  localization: Localization;

  // Custom renderers
  customRenderers?: CustomRenderers<TData>;

  // Column visibility
  columnVisibility?: {
    mode: "show" | "hide"; // "show" = only show listed columns, "hide" = hide listed columns
    columns: Array<keyof TData>; // Column IDs to show or hide based on mode
  };
  columnOrder?: Array<keyof TData>; // Array of column IDs to define display order (TData keys + custom column IDs)

  // Advanced
  enableMultiSort?: boolean;
  enableMultiFilter?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  manualPagination?: boolean;
  rowCount?: number; // Total row count for manual pagination
  onSortingChange?: (sorting: SortingState) => void;
  onFilteringChange?: (filters: ColumnFiltersState) => void;
  onPaginationChange?: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  onRefresh?: () => void;

  // Row identification
  getRowId?: (row: TData, index: number) => string;
}

/**
 * Master Data Grid Props
 */
export interface MasterDataGridProps<TData = unknown> {
  data: TData[];
  config: MasterDataGridConfig<TData>;
  onDataChange?: (data: TData[]) => void;
}

/**
 * Internal Table State
 */
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
  editingRows?: Record<string, Record<string, unknown>>; // rowId -> edited values
}

/**
 * Filter Dialog State
 */
export interface FilterDialogState {
  open: boolean;
  columnId: string | null;
  currentFilter?: ColumnFilter;
}

/**
 * Custom Cell Renderer Function Type
 * Allows passing custom components for specific fields with their own validation
 */
export interface CustomCellRendererProps<TData = unknown> {
  value: unknown;
  row: Row<TData>;
  column: Column<TData>;
  onUpdate?: (value: unknown) => void;
  error?: string;
  schemaProperty?: JSONSchemaProperty;
  t?: Record<string, string>;
}

export type CustomCellRenderer<TData = unknown> = (
  props: CustomCellRendererProps<TData>
) => React.ReactNode;

/**
 * Custom Renderers Configuration
 * Map field names or types to custom renderer components
 */
export interface CustomRenderers<TData = unknown> {
  /** Custom renderers for specific field names */
  byField?: Partial<Record<keyof TData & string, CustomCellRenderer<TData>>>;
  /** Custom renderers for specific JSON Schema types */
  byType?: Partial<
    Record<JSONSchemaProperty["type"], CustomCellRenderer<TData>>
  >;
  /** Custom renderers for specific formats */
  byFormat?: Partial<
    Record<NonNullable<JSONSchemaProperty["format"]>, CustomCellRenderer<TData>>
  >;
}

/**
 * Column Generator Result
 */
export type GeneratedColumn<TData = unknown> = ColumnDef<TData> & {
  meta?: {
    schemaProperty?: JSONSchemaProperty;
    filterOperators?: FilterOperator[];
    [key: string]: unknown;
  };
};

/**
 * Cell Props for custom cell renderers
 */
export type CellProps<TData = unknown, TValue = unknown> = CellContext<
  TData,
  TValue
>;

/**
 * Column Meta with expandOnClick support
 */
export interface ExpandableColumnMeta extends ColumnMeta {
  expandOnClick?: boolean;
}

/**
 * Export Column Definition with typed accessors
 */
export interface ExportColumnDef<TData = unknown> {
  accessorKey?: string;
  accessorFn?: (row: TData, index: number) => unknown;
  header?: string | ((info: any) => React.ReactNode);
  id?: string;
  meta?: ColumnMeta;
}

/**
 * Cell Renderer Props
 */
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
  t?: Record<string, string>;
  errorDisplayMode?: "tooltip" | "inline" | "both";
  className?: string;
  dateOptions?: Intl.DateTimeFormatOptions;
  localization?: any;
  fieldName?: keyof TData & string;
  customRenderers?: CustomRenderers<TData>;
}

export type MasterDataGridResources = {
  // Toolbar translations
  "toolbar.search": string;
  "toolbar.filters": string;
  "toolbar.columns": string;
  "toolbar.export": string;
  "toolbar.refresh": string;
  "toolbar.reset": string;
  "toolbar.selected": string;
  "toolbar.actions": string;

  // Pagination translations
  "pagination.rowsPerPage": string;
  "pagination.page": string;
  "pagination.of": string;
  "pagination.rowsSelected": string;
  "pagination.firstPage": string;
  "pagination.previousPage": string;
  "pagination.nextPage": string;
  "pagination.lastPage": string;

  // Column header translations
  "column.sortAsc": string;
  "column.sortDesc": string;
  "column.pinLeft": string;
  "column.pinRight": string;
  "column.unpin": string;
  "column.filter": string;
  "column.resetSize": string;
  "column.hide": string;

  // Filter translations
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
  "filter.operator.short.equals": string;
  "filter.operator.short.notEquals": string;
  "filter.operator.short.contains": string;
  "filter.operator.short.notContains": string;
  "filter.operator.short.startsWith": string;
  "filter.operator.short.endsWith": string;
  "filter.operator.short.isEmpty": string;
  "filter.operator.short.isNotEmpty": string;
  "filter.operator.short.greaterThan": string;
  "filter.operator.short.greaterThanOrEqual": string;
  "filter.operator.short.lessThan": string;
  "filter.operator.short.lessThanOrEqual": string;
  "filter.operator.short.between": string;
  "filter.operator.short.inRange": string;
  "filter.operator.short.before": string;
  "filter.operator.short.after": string;
  "filter.operator.short.inList": string;
  "filter.operator.short.notInList": string;
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

  // Column settings translations
  "columnSettings.title": string;
  "columnSettings.description": string;
  "columnSettings.showAll": string;
  "columnSettings.hideAll": string;

  // Table translations
  "table.empty": string;
  "table.noResults": string;

  // Validation translations
  "validation.invalidString": string;
};
