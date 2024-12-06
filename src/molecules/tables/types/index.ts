import { ColumnDef, Row, RowData } from '@tanstack/react-table';
import { z } from 'zod';
import {
  AutoFormProps,
  ZodObjectOrWrapped,
} from '../../../organisms/auto-form';
import { ColumnFilter } from '../filter-column';

export type { ColumnFilter };
export type FilterColumnResult = { [key: string]: string | string[] };
declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    removeRow: (
      rowIndex: number,
      columnId: string,
      value: unknown | TData
    ) => void;
    updateData: (
      rowIndex: number,
      columnId: string,
      value: unknown | TData
    ) => void;
  }
}

export type TableAction<T = undefined> = TableActionCommon<
  undefined extends T ? unknown : T
> &
  (
    | TableActionNewPage
    | TableActionDialog<undefined extends T ? unknown : T>
    | TableActionAction
  );

export type TableActionCommon<T = unknown> = {
  cta: string | ((triggerData?: T) => string);
};

export type TableActionDialog<TData = unknown> = {
  description: string | ((triggerData?: TData) => string);
  type: 'Dialog' | 'Sheet';
} & (TableActionAutoform<TData> | TableActionCustom | TableActionConfirmation);

export type TableActionNewPage = {
  href: string;
  type: 'NewPage';
};

export type TableActionAutoform<TData> = {
  autoFormArgs: {
    preFetch?: {
      functionCall: (
        triggerData: TData
      ) => Promise<Partial<z.infer<ZodObjectOrWrapped>>>;
    };
    submit?: {
      className?: string;
      cta?: string;
    };
  } & AutoFormProps;
  callback: (
    values: any,
    triggerData?: unknown,
    onOpenChange?: (e: boolean) => void
  ) => void;
  componentType: 'Autoform';
};
export type TableActionCustom = {
  customComponentRendering?: (
    values?: any,
    setIsOpen?: (e: boolean) => void
  ) => Promise<JSX.Element>;
  componentType: 'CustomComponent';
  content?: JSX.Element;
  loadingContent: JSX.Element;
};
export type TableActionConfirmation = {
  callback?: (values?: any) => void;
  cancelCTA?: string;
  componentType: 'ConfirmationDialog';
  content?: JSX.Element;
  variant: 'destructive' | 'default';
};

export type TableActionAction = {
  callback: (values: any) => void;
  type: 'Action';
};

type IsUnknown<T> = unknown extends T
  ? T extends unknown
    ? true
    : false
  : false;

export type AutoColumnGenerator<TData = unknown> = {
  actionList?: TableAction<TData>[];
  customCells?: Partial<
    Record<keyof TData, customCells<TData> | ColumnDef<TData>['cell']>
  >;
  dateOptions?: Intl.DateTimeFormatOptions;
  excludeList?: IsUnknown<TData> extends true
    ? Array<string>
    : Array<keyof TData>;
  hideAction?: boolean;
  language?: Intl.LocalesArgument;
  positions?: IsUnknown<TData> extends true
    ? Array<string>
    : Array<keyof TData>;
  tableType: any;
} & (noSelectAbleColumns | selectableColumns);

type customCells<TData> = customBadgeCells | customLinkCells<TData>;

type customBadgeCells = {
  Type: 'badge';
  className?: string;
};

type customLinkCells<TData> = {
  Type: 'link';
  cellValue?: string | ((row: TData) => string);
  href: string | ((row: TData) => string);
};

export type selectableColumns = {
  onSelect: ({
    row,
    value,
    all,
  }: {
    all: boolean;
    row: unknown;
    value: boolean;
  }) => void;
  selectable?: true;
};

type noSelectAbleColumns = {
  selectable?: false;
};

export type ColumnsType<TData = unknown> =
  | ColumnsCustomType<TData>
  | ColumnAutoType<TData>;
type ColumnsCustomType<TData> = {
  data: { actionList?: TableAction[]; columns: ColumnDef<TData>[] };
  type: 'Custom';
};

export type ColumnAutoType<TData> = {
  data: AutoColumnGenerator<TData>;
  type: 'Auto';
};

export type DataTableClassNames = {
  actions?: {
    container?: string;
    wrapper?: string;
  };
  container?: string;
  filters?: {
    container?: string;
    items?: string;
    wrapper?: string;
  };
  footer?: {
    buttons?: {
      container?: string;
      next?: string;
      previous?: string;
    };
    container?: string;
    editable?: {
      add?: string;
      container?: string;
      remove?: string;
      wrapper?: string;
    };
    selectedRows?: string;
  };
  table?: {
    body?: string;
    container?: string;
    header?: string;
    pagination?: string;
    wrapper?: string;
  };
  tableWrapper?: string;
};
export type DataTableProps<TData> = {
  Headertable?: any;
  action?: TableAction | TableAction[];
  classNames?: DataTableClassNames;
  columnsData: ColumnsType<TData>;
  data: TData[];
  detailedFilter?: ColumnFilter[];
  editable?: boolean;
  fetchRequest?: (props: fetchRequestProps) => void;
  isLoading?: boolean;
  onDataUpdate?: (data: TData[]) => void;
  renderSubComponent?: (row: Row<TData>) => JSX.Element;
  rowCount?: number;
  showView?: boolean;
  filterType?: 'Badge' | 'Column';
};

export type fetchRequestProps = {
  filter: FilterColumnResult;
  page: number;
  pageSize?: number;
};
