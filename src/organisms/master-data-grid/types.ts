import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import type { Localization } from "../../custom/date-tooltip";
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
 * Aggregation Function Types
 */
export type AggregationFunction =
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "count"
  | "countDistinct";

/**
 * Column Aggregation Configuration
 */
export interface ColumnAggregation {
  id: string;
  function: AggregationFunction;
  label?: string;
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
 * Row Action Types
 */
export type RowActionType = "click" | "dialog" | "sheet" | "drawer" | "custom";

/**
 * Row Action Definition
 */
export interface RowAction<TData = unknown> {
  id: string;
  label: string | ((row: TData) => string);
  icon?: LucideIcon;
  type: RowActionType;
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
  component?: React.ComponentType<{ row: TData; onClose: () => void }>;
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
  header?: string;
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
  aggregationFn?: AggregationFunction;
  cell?: (info: {
    getValue: () => unknown;
    row: Row<TData>;
  }) => React.ReactNode;
  footer?: (info: { column: { id: string } }) => React.ReactNode;
  meta?: ColumnMeta;
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
  t?: Record<string, string>;

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

  // Loading & Empty States
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  emptyMessage?: string;

  // Date formatting
  dateOptions?: Intl.DateTimeFormatOptions;
  localization: Localization;

  // Custom renderers
  customRenderers?: CustomRenderers;

  // Advanced
  enableMultiSort?: boolean;
  enableMultiFilter?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  manualPagination?: boolean;
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
 * Column Settings Dialog State
 */
export interface ColumnSettingsDialogState {
  open: boolean;
}

/**
 * Action Dialog State
 */
export interface ActionDialogState<TData = unknown> {
  open: boolean;
  type: RowActionType | null;
  action: RowAction<TData> | null;
  row: TData | null;
}

/**
 * Custom Cell Renderer Function Type
 * Allows passing custom components for specific fields with their own validation
 */
export interface CustomCellRendererProps {
  value: unknown;
  onUpdate?: (value: unknown) => void;
  error?: string;
  schemaProperty?: JSONSchemaProperty;
  t?: Record<string, string>;
}

export type CustomCellRenderer = (
  props: CustomCellRendererProps
) => React.ReactNode;

/**
 * Custom Renderers Configuration
 * Map field names or types to custom renderer components
 */
export interface CustomRenderers {
  /** Custom renderers for specific field names */
  byField?: Record<string, CustomCellRenderer>;
  /** Custom renderers for specific JSON Schema types */
  byType?: Partial<Record<JSONSchemaProperty["type"], CustomCellRenderer>>;
  /** Custom renderers for specific formats */
  byFormat?: Partial<
    Record<NonNullable<JSONSchemaProperty["format"]>, CustomCellRenderer>
  >;
}

/**
 * Cell Renderer Props
 */
export interface CellRendererProps {
  value: unknown;
  schemaProperty?: JSONSchemaProperty;
  editable?: boolean;
  onUpdate?: (value: unknown) => void;
  t?: Record<string, string>;
  error?: string;
  className?: string;
  dateOptions?: Intl.DateTimeFormatOptions;
  localization: Localization;
  /** Field name for custom renderer lookup */
  fieldName?: string;
  /** Custom renderers for special cases */
  customRenderers?: CustomRenderers;
  /** How to display validation errors */
  errorDisplayMode?: "tooltip" | "inline" | "both";
}

/**
 * Toolbar Props
 */
export interface ToolbarProps<TData = unknown> {
  table: unknown; // TanStack Table instance
  config: MasterDataGridConfig<TData>;
  selectedRows: TData[];
  onExport?: (format: string) => void;
  onRefresh?: () => void;
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
