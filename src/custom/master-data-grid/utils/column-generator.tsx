import type { Column, ColumnDef, Row, Header } from "@tanstack/react-table";
import { HeaderCell, CellRenderer } from "../components/table";
import type {
  ColumnConfig,
  CustomRenderers,
  GeneratedColumn,
  JSONSchema,
  JSONSchemaProperty,
  Localization,
} from "../types";
import { getFilterOperators, masterFilter } from "./filter-fns";
import { getColumnName } from "./translation-utils";
import { GenericObjectType } from "@rjsf/utils";

/**
 * Generate TanStack Table columns from JSON Schema
 */
export function generateColumnsFromSchema<TData = unknown>(
  schema: JSONSchema | GenericObjectType,
  localization: Localization,
  t?: Record<string, string>,
  onFilterClick?: (columnId: string) => void,
  editingContext?: {
    editingRows: Record<string, Record<string, unknown>>;
    onCellUpdate: (rowId: string, columnId: string, value: unknown) => void;
    getRowId: (row: TData, index: number) => string;
  },
  cellClassName?: string | ((cell: { row: TData; columnId: string }) => string),
  dateOptions?: Intl.DateTimeFormatOptions,
  customRenderers?: CustomRenderers<TData>,
  errorDisplayMode?: "tooltip" | "inline" | "both",
  enableColumnVisibility?: boolean,
  expandOnClickColumns?: string[]
): GeneratedColumn<TData>[] {
  if (!schema.properties) return [];

  const columns: GeneratedColumn<TData>[] = [];

  Object.entries(schema.properties).forEach(([key, property]) => {
    const column = createColumnFromProperty<TData>(
      key,
      property as JSONSchemaProperty,
      localization,
      t,
      onFilterClick,
      editingContext,
      cellClassName,
      dateOptions,
      customRenderers,
      errorDisplayMode,
      enableColumnVisibility,
      expandOnClickColumns
    );
    if (column) {
      columns.push(column);
    }
  });

  return columns;
}

/**
 * Create a single column from schema property
 */
function createColumnFromProperty<TData = unknown>(
  key: string,
  property: JSONSchemaProperty,
  localization: Localization,
  t?: Record<string, string>,
  onFilterClick?: (columnId: string) => void,
  editingContext?: {
    editingRows: Record<string, Record<string, unknown>>;
    onCellUpdate: (rowId: string, columnId: string, value: unknown) => void;
    getRowId: (row: TData, index: number) => string;
  },
  cellClassName?: string | ((cell: { row: TData; columnId: string }) => string),
  dateOptions?: Intl.DateTimeFormatOptions,
  customRenderers?: CustomRenderers<TData>,
  errorDisplayMode?: "tooltip" | "inline" | "both",
  enableColumnVisibility?: boolean,
  expandOnClickColumns?: string[]
): GeneratedColumn<TData> | null {
  // Skip object and array types for now (can be customized)
  if (property.type === "object" || property.type === "array") {
    return null;
  }

  const filterOperators = getFilterOperators(property.type, property.format);

  return {
    id: key,
    accessorKey: key,
    header: ({
      column,
      header,
    }: {
      column: Column<TData>;
      header: Header<TData, unknown>;
    }) => (
      <HeaderCell<TData>
        column={column}
        header={header}
        label={getColumnName(key, t, property.title)}
        t={t}
        onFilterClick={onFilterClick}
      />
    ),
    cell: ({
      getValue,
      row,
      column,
    }: {
      getValue: () => unknown;
      row: Row<TData>;
      column: Column<TData>;
    }) => {
      const rowId =
        editingContext?.getRowId(row.original, row.index) || String(row.index);
      const isEditing = editingContext?.editingRows[rowId] !== undefined;
      const editedValue = editingContext?.editingRows[rowId]?.[key];
      const displayValue =
        isEditing && editedValue !== undefined ? editedValue : getValue();

      // Calculate className
      const className =
        typeof cellClassName === "function"
          ? cellClassName({ row: row.original, columnId: key })
          : cellClassName;

      return (
        <CellRenderer
          value={displayValue}
          row={row}
          column={column}
          columnId={key}
          schemaProperty={property}
          t={t}
          isEditing={isEditing}
          onUpdate={
            isEditing
              ? (value: unknown) =>
                  editingContext?.onCellUpdate(rowId, key, value)
              : undefined
          }
          className={className}
          dateOptions={dateOptions}
          localization={localization}
          fieldName={key as keyof TData & string}
          customRenderers={customRenderers}
          errorDisplayMode={errorDisplayMode}
        />
      );
    },
    enableSorting: !property.readOnly,
    enableFiltering: !property.readOnly,
    enableHiding: enableColumnVisibility ?? true,
    filterFn: masterFilter,
    meta: {
      schemaProperty: property,
      filterOperators,
      expandOnClick: expandOnClickColumns?.includes(key),
    },
  } as GeneratedColumn<TData>;
}

/**
 * Merge schema-generated columns with custom column configs
 */
export function mergeColumns<TData = unknown>(
  schemaColumns: GeneratedColumn<TData>[],
  customColumns?: ColumnConfig<TData>[],
  editingContext?: {
    readonly editingRows: Record<string, Record<string, unknown>>;
    getRowId: (row: TData, index: number) => string;
  },
  enableColumnVisibility?: boolean,
  t?: Record<string, string>,
  onFilterClick?: (columnId: string) => void
): ColumnDef<TData>[] {
  if (!customColumns || customColumns.length === 0) {
    return schemaColumns;
  }

  const merged: ColumnDef<TData>[] = [];
  const customColumnMap = new Map(customColumns.map((c) => [c.id, c]));

  // Start with schema columns and override with custom configs
  schemaColumns.forEach((schemaCol) => {
    if (!schemaCol.id) return;

    const custom = customColumnMap.get(schemaCol.id);

    if (custom) {
      // If custom has a cell renderer, we need to wrap it to handle edit mode
      const customCell = custom.cell;
      const schemaCell = schemaCol.cell;

      let finalCell = customCell || schemaCell;

      // If both exist and editingContext is provided, wrap to check edit mode
      if (
        customCell &&
        schemaCell &&
        typeof schemaCell === "function" &&
        editingContext
      ) {
        finalCell = (props) => {
          // Check if this row is in edit mode
          const rowId =
            editingContext.getRowId(props.row.original, props.row.index) ||
            String(props.row.index);
          const isEditing = editingContext.editingRows[rowId] !== undefined;

          // In edit mode, use schema-based cell (editable inputs)
          if (isEditing) {
            return typeof schemaCell === "function"
              ? schemaCell(props)
              : schemaCell;
          }

          // Otherwise, use custom cell renderer
          return typeof customCell === "function"
            ? customCell(props)
            : customCell;
        };
      }

      // Determine header behavior
      let finalHeader = custom.header || schemaCol.header;

      // If custom header is provided but extendHeader is not explicitly false,
      // we keep the schema's HeaderCell wrapper with custom label
      if (
        custom.header &&
        custom.extendHeader !== false &&
        typeof custom.header === "string"
      ) {
        // Custom string header with HeaderCell functionality
        finalHeader = ({
          column,
          header,
        }: {
          column: Column<TData>;
          header: Header<TData, unknown>;
        }) => (
          <HeaderCell<TData>
            column={column}
            header={header}
            label={custom.header as string}
            t={t}
            onFilterClick={onFilterClick}
          />
        );
      } else if (custom.header && custom.extendHeader === false) {
        // Explicitly override header completely
        finalHeader = custom.header;
      }
      // else: use schema header (which already has HeaderCell)

      merged.push({
        ...schemaCol,
        ...custom,
        header: finalHeader,
        cell: finalCell,
        enableHiding: custom.enableHiding ?? enableColumnVisibility ?? true,
        meta: {
          ...schemaCol.meta,
          ...custom.meta,
        },
      } as ColumnDef<TData>);
      if (schemaCol.id) customColumnMap.delete(schemaCol.id);
    } else {
      merged.push(schemaCol);
    }
  });

  // Add remaining custom columns that weren't in schema
  customColumnMap.forEach((custom) => {
    // Determine the header to use
    let header:
      | string
      | ((info: {
          column: Column<TData>;
          header: Header<TData, unknown>;
        }) => React.ReactNode);

    if (custom.extendHeader !== false) {
      // Default behavior: extend with HeaderCell functionality
      header = ({
        column,
        header: headerObj,
      }: {
        column: Column<TData>;
        header: Header<TData, unknown>;
      }) => {
        const label =
          typeof custom.header === "string"
            ? custom.header
            : formatFieldName(custom.id);

        return (
          <HeaderCell<TData>
            column={column}
            header={headerObj}
            label={label}
            t={t}
            onFilterClick={onFilterClick}
          />
        );
      };
    } else if (typeof custom.header === "function") {
      // Custom header function provided and extendHeader is explicitly false
      header = custom.header;
    } else {
      // Simple string header and extendHeader is false
      header = custom.header || formatFieldName(custom.id);
    }

    merged.push({
      id: custom.id,
      accessorKey: custom.accessorKey,
      accessorFn: custom.accessorFn,
      header,
      cell: custom.cell,
      enableSorting: custom.enableSorting ?? true,
      enableFiltering: custom.enableFiltering ?? true,
      enableGrouping: custom.enableGrouping ?? false,
      enablePinning: custom.enablePinning ?? true,
      enableResizing: custom.enableResizing ?? true,
      enableHiding: custom.enableHiding ?? enableColumnVisibility ?? true,
      size: custom.width,
      minSize: custom.minWidth,
      maxSize: custom.maxWidth,
      footer: custom.footer,
      filterFn: masterFilter,
      meta: custom.meta,
    } as ColumnDef<TData>);
  });

  return merged;
}

/**
 * Format field name to human-readable label
 */
function formatFieldName(fieldName: string): string {
  // Convert camelCase or snake_case to Title Case
  return fieldName
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
}

/**
 * Get column value from nested object path
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;

  const keys = path.split(".");
  let value: unknown = obj;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Set column value in nested object path
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const keys = path.split(".");
  const lastKey = keys.pop();

  if (!lastKey) return;

  let current: Record<string, unknown> = obj;

  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[lastKey] = value;
}

/**
 * Calculate column width based on content and schema
 */
export function calculateColumnWidth(
  property: JSONSchemaProperty,
  fieldName: string
): number {
  // Default widths based on type
  const defaultWidths: Record<string, number> = {
    boolean: 100,
    integer: 120,
    number: 120,
    string: 200,
  };

  // Adjust based on format
  if (property.format === "date") return 140;
  if (property.format === "date-time") return 180;
  if (property.format === "email") return 220;
  if (property.format === "uri") return 250;
  if (property.format === "uuid") return 280;

  // Adjust based on enum (select)
  if (property.enum && property.enum.length > 0) {
    const maxLength = Math.max(
      ...property.enum.map((v: string | number) => String(v).length)
    );
    return Math.min(Math.max(maxLength * 10 + 60, 120), 300);
  }

  // Adjust based on max length
  if (property.maxLength) {
    return Math.min(Math.max(property.maxLength * 8 + 40, 120), 400);
  }

  return defaultWidths[property.type] || 200;
}
