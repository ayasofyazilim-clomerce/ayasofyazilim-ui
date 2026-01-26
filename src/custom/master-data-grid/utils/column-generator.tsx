import type { Column, ColumnDef, Row, Header } from "@tanstack/react-table";
import { HeaderCell, CellRenderer } from "../components/table";
import type {
  ColumnConfig,
  CustomRenderers,
  GeneratedColumn,
  JSONSchema,
  JSONSchemaProperty,
  Localization,
  MasterDataGridResources,
} from "../types";
import { getFilterOperators, masterFilter } from "./filter-fns";
import { getColumnName } from "./translation-utils";
import { GenericObjectType } from "@rjsf/utils";

export function generateColumnsFromSchema<TData = unknown>(
  schema: JSONSchema | GenericObjectType,
  localization: Localization,
  t?: MasterDataGridResources,
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

function createColumnFromProperty<TData = unknown>(
  key: string,
  property: JSONSchemaProperty,
  localization: Localization,
  t?: MasterDataGridResources,
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

export function mergeColumns<TData = unknown>(
  schemaColumns: GeneratedColumn<TData>[],
  customColumns?: ColumnConfig<TData>[],
  editingContext?: {
    readonly editingRows: Record<string, Record<string, unknown>>;
    getRowId: (row: TData, index: number) => string;
  },
  enableColumnVisibility?: boolean,
  t?: MasterDataGridResources
): ColumnDef<TData>[] {
  if (!customColumns || customColumns.length === 0) {
    return schemaColumns;
  }

  const merged: ColumnDef<TData>[] = [];
  const customColumnMap = new Map(customColumns.map((c) => [c.id, c]));

  schemaColumns.forEach((schemaCol) => {
    if (!schemaCol.id) return;

    const custom = customColumnMap.get(schemaCol.id);

    if (custom) {
      const customCell = custom.cell;
      const schemaCell = schemaCol.cell;

      let finalCell = customCell || schemaCell;

      if (
        customCell &&
        schemaCell &&
        typeof schemaCell === "function" &&
        editingContext
      ) {
        finalCell = (props) => {
          const rowId =
            editingContext.getRowId(props.row.original, props.row.index) ||
            String(props.row.index);
          const isEditing = editingContext.editingRows[rowId] !== undefined;

          if (isEditing) {
            return typeof schemaCell === "function"
              ? schemaCell(props)
              : schemaCell;
          }

          return typeof customCell === "function"
            ? customCell(props)
            : customCell;
        };
      }

      let finalHeader = custom.header || schemaCol.header;

      if (
        custom.header &&
        custom.extendHeader !== false &&
        typeof custom.header === "string"
      ) {
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
          />
        );
      } else if (custom.header && custom.extendHeader === false) {
        finalHeader = custom.header;
      }

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

  customColumnMap.forEach((custom) => {
    let header:
      | string
      | ((info: {
          column: Column<TData>;
          header: Header<TData, unknown>;
        }) => React.ReactNode);

    if (custom.extendHeader !== false) {
      header = ({
        column,
        header: headerObj,
      }: {
        column: Column<TData>;
        header: Header<TData, unknown>;
      }) => {
        const label =
          typeof custom.header === "string" ? custom.header : custom.id;

        return (
          <HeaderCell<TData>
            column={column}
            header={headerObj}
            label={label}
            t={t}
          />
        );
      };
    } else if (typeof custom.header === "function") {
      header = custom.header;
    } else {
      header = custom.header || custom.id;
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
