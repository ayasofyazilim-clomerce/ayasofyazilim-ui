import { SchemaFormProps } from '@repo/ayasofyazilim-ui/custom/schema-form/types';
import {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  TableMeta,
} from '@tanstack/react-table';
import { ComponentType, JSX } from 'react';

export type NonEditableTanstackTableProps<TData> = {
  rowCount: number;
  data: TData[];
  columnFilters: ColumnFiltersState;
  pagination: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
};
export type EditableTanstackTableProps<TData> = {
  data: TData[];
  meta?: TableMeta<TData>;
};
export type TanstackBaseProps<TData, TValue> = {
  title?: string;
  resizeable?: boolean;
  columns: ColumnDef<TData, TValue>[];
  columnOrder?: (keyof TData)[];
  data: TData[];
  columnVisibility?:
  | {
    columns: ('select' | keyof TData)[];
    type: 'show' | 'hide';
  }
  | undefined;
  pinColumns?: (keyof TData)[];
  rowActions?: TanstackTableRowActionsType<TData>[];
  rowCount?: number;
  selectedRowAction?: TanstackTableSelectedRowActionType<TData>;
  tableActions?: TanstackTableTableActionsType<TData>[] | undefined;
  excludeColumns?: (keyof TData)[];
  showPagination?: boolean;
  expandedRowComponent?: (
    row: TData,
    toggleExpanded: () => void
  ) => JSX.Element;
  fillerColumn?: keyof TData;
  editable: boolean;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  columnFilters?: ColumnFiltersState;
  pagination?: PaginationState;
  filters?: TanstackTableFiltersType;
  meta?: TableMeta<TData>;
};
export type TanstackTablePropsType<TData, TValue> = {
  title?: string;
  resizeable?: boolean;

  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  fillerColumn?: keyof TData;
  pinColumns?: (keyof TData)[] | undefined;
  columnOrder?: (keyof TData)[] | undefined;
  columnVisibility?:
  | {
    columns: (keyof TData | 'select')[];
    type: 'show' | 'hide';
  }
  | undefined;
  excludeColumns?: (keyof TData)[];
  rowActions?: TanstackTableRowActionsType<TData>[] | undefined;
  selectedRowAction?: TanstackTableSelectedRowActionType<TData> | undefined;
  tableActions?: TanstackTableTableActionsType<TData>[] | undefined;
  filters?: TanstackTableFiltersType | undefined;
  showPagination?: boolean;
  expandedRowComponent?:
  | ((row: TData, toggleExpanded: () => void) => JSX.Element)
  | undefined;
} & (
    | {
      rowCount?: number;
      editable?: undefined;
      onTableDataChange?: undefined;
    }
    | {
      editable: true;
      rowCount?: undefined;
      onTableDataChange?: (data: TData[]) => void;
    }
  );

export type TanstackTableConfig = {
  dateOptions?: Intl.DateTimeFormatOptions;
  locale?: Intl.LocalesArgument;
};
export type TanstackTableCellCondition = {
  conditionAccessorKey: string;
  when: (value: string | boolean | number | Date) => boolean;
};
export type TanstackTableColumnClassNames = {
  className?: string;
  conditions?: TanstackTableCellCondition[];
};
export type TanstackTableFacetedFilterType = {
  className?: string;
  icon?: ComponentType<{ className?: string }>;
  iconClassName?: string;
  label: string;
  when?: (value: string | boolean | number | Date) => boolean;
  value: string;
  hideColumnValue?: boolean;
};
export type TanstackTableDateFilterType = {
  endAccessorKey?: string;
  label: string;
  startAccessorKey: string;
  canFilteredBySingleDate?: boolean;
};

export type TanstackTableFiltersType = {
  dateFilters?: TanstackTableDateFilterType[];
  facetedFilters?: Record<
    string,
    {
      options: TanstackTableFacetedFilterType[];
      title: string;
    }
  >;
  textFilters?: string[];
  filterTitles?: Record<string, string>;
};

export type TanstackTableColumnLink = {
  conditions?: TanstackTableCellCondition[];
  prefix: string;
  suffix?: string;
  targetAccessorKey?: string;
};
export type TanstackTableColumnBadge = {
  className?: string;
  hideColumnValue?: boolean;
  values: {
    position?: 'before' | 'after';
    badgeClassName?: string;
    conditions?: TanstackTableCellCondition[];
    label: string;
  }[];
};
export type TanstackTableColumnIcon = {
  icon?: ComponentType<{ className?: string }>;
  iconClassName?: string;
  position?: 'before' | 'after';
};
export type TanstackTableColumCell<TData> = {
  conditions?: TanstackTableCellCondition[];
  content: (row: TData) => JSX.Element | string | null;
  showHeader?: boolean;
};
export type TanstackTableRowActionsDeleteRow = {
  type: 'delete-row';
};
export type TanstackTableRowActionsDuplicateRow = {
  type: 'duplicate-row';
};
export type TanstackTableRowActionsMoveRowUp = {
  type: 'move-row-up';
};
export type TanstackTableRowActionsMoveRowDown = {
  type: 'move-row-down';
};
export type TanstackTableRowActionsSimple<TData> = {
  onClick: (row: TData) => void;
  type: 'simple';
};

export type TanstackTableRowDialog<TData> = {
  cancelText?: string;
  confirmationText?: string;
  onCancel?: (row: TData) => void;
  onConfirm?: (row: TData) => void;
  title: string | ((row: TData) => string | JSX.Element);
};
export type TanstackTableRowActionsCustomDialog<TData> =
  TanstackTableRowDialog<TData> & {
    cancelText?: string;
    confirmationText?: string;
    content:
    | JSX.Element
    | ((row: TData, closeDialog?: () => void) => JSX.Element);
    type: 'custom-dialog';
  };
export type TanstackTableRowActionsConfirmationDialog<TData> =
  TanstackTableRowDialog<TData> & {
    cancelText: string;
    confirmationText: string;
    description: string;
    onCancel?: (row: TData) => void;
    onConfirm: (row: TData) => void;
    type: 'confirmation-dialog';
  };

export type TanstackTableRowActionsType<TData> = {
  actionLocation: 'row';
  cta: string;
  condition?: (row: TData) => boolean;
  icon?: ComponentType<{ className?: string }>;
} & (
    | TanstackTableRowActionsConfirmationDialog<TData>
    | TanstackTableRowActionsSimple<TData>
    | TanstackTableRowActionsDeleteRow
    | TanstackTableRowActionsDuplicateRow
    | TanstackTableRowActionsMoveRowUp
    | TanstackTableRowActionsMoveRowDown
    | TanstackTableRowActionsCustomDialog<TData>
  );

export type TanstackTableActionsSimple = {
  actionLocation: 'table';
  onClick: () => void;
  type: 'simple';
};
export type TanstackTableCreateRowAction = {
  actionLocation: 'table';
  onClick?: () => void;
  type: 'create-row';
};
export type TanstackTableActionsDialog = {
  cancelText?: string;
  confirmationText?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  title: string;
};


export type TanstackTableActionsSchemaFormDialog<TData> = Omit<
  TanstackTableActionsDialog,
  'cancelText' | 'onCancel' | 'confirmationText' | 'onConfirm'
> & {
  className?: { autoform: string; submit: string };
  onSubmit: (values: TData | undefined) => void;
  submitText: string;
  type: 'schemaform-dialog';
} & Omit<SchemaFormProps<TData>, 'onSubmit'>;
export type TanstackTableActionsCustomDialog = TanstackTableActionsDialog & {
  content: JSX.Element | ((closeDialog?: () => void) => JSX.Element);
  type: 'custom-dialog';
  dialogClassNames?: {
    content?: string;
    header?: string;
    title?: string;
    footer?: string;
  };
};

export type TanstackTableTableActionsType<TData> = {
  actionLocation: 'table';
  cta: string;
  icon?: ComponentType<{ className?: string }>;
  condition?: (data: TData[]) => boolean;
} & (
    | TanstackTableActionsSimple
    | TanstackTableActionsCustomDialog
    | TanstackTableCreateRowAction
    | TanstackTableActionsSchemaFormDialog<TData>
  );

export type TanstackTableSelectedRowActionType<TData> = {
  actionLocation: 'table';
  cta: string;
  icon?: ComponentType<{ className?: string }>;
  onClick: (selectedIds: string[], selectedRows: TData[]) => void;
};

export type TanstackTableLanguageDataTypeWithConstantKey = {
  constantKey: string;
  languageData: Record<string, string>;
};
export type TanstackTableLanguageDataType =
  | Record<string, string>
  | TanstackTableLanguageDataTypeWithConstantKey;

export type TanstackTableCreateColumnsByRowId<T> = {
  badges?: Partial<Record<keyof T, TanstackTableColumnBadge>>;
  classNames?: Partial<Record<keyof T, TanstackTableColumnClassNames[]>>;
  config?: TanstackTableConfig;
  custom?: Partial<Record<keyof T, TanstackTableColumCell<T>>>;
  excludeColumns?: Partial<keyof T>[];
  expandRowTrigger?: keyof T;
  faceted?: Partial<
    Record<keyof T, { options: TanstackTableFacetedFilterType[] }>
  >;
  icons?: Partial<Record<keyof T, TanstackTableColumnIcon>>;
  languageData?: TanstackTableLanguageDataType;
  links?: Partial<Record<keyof T, TanstackTableColumnLink>>;
  rows: Record<
    keyof T,
    {
      format?: string;
      type: string;
    }
  >;
  selectableRows?: boolean;
  onSelectedRowChange?: (selectedRows: T[]) => void;
  disabledRowIds?: string[];
  localization: { locale: string; timeZone: string; lang: string };
};

export type TanstacktableEditableColumnsByRowId<T> = {
  excludeColumns?: Partial<keyof T>[];
  editableColumns?: Partial<keyof T>[];
  languageData?: TanstackTableLanguageDataType;
  rows: Record<
    string,
    {
      enum?: Array<{
        label: string;
        value: string;
      }>;
      format?: string;
      type: string;
    }
  >;
};

export type TanstackTableCreationProps<T> = Omit<
  TanstackTablePropsType<T, string>,
  'columns' | 'data' | 'rowCount' | 'editable' | 'onTableDataChange'
>;
