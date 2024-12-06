import { Cross1Icon } from '@radix-ui/react-icons';
import { Trash2 } from 'lucide-react';
import React, { Dispatch, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AdvancedCalendar from '../advanced-calendar';
import { MultiSelect, MultiSelectProps } from '../multi-select';
import CustomTableActionDialog from '../dialog';
import {
  AutoColumnGenerator,
  DataTableProps,
  FilterColumnResult,
} from './types';
import DataTable from '.';
import { Badge } from '@/components/ui/badge';

export type ColumnFilter = BaseColumnFilter &
  (
    | StandartColumnFilter
    | SelectColumnFilter
    | BooleanColumnFilter
    | MultipleFilter
    | AsyncFilter
  );

export type BaseColumnFilter = {
  displayName: string;
  name: string;
  value: string;
};
export type SelectColumnFilter = {
  options: { label: string; value: string }[];
  placeholder: string;
  type: 'select';
};
export type MultipleFilter = {
  htmlProps?: MultiSelectProps;
  multiSelectProps: MultiSelectProps;
  type: 'select-multiple';
};
export type AsyncFilter = {
  columnDataType: AutoColumnGenerator;
  data: unknown[];
  detailedFilters: DataTableProps<unknown>['detailedFilter'];
  fetchRequest: (
    page: number,
    filter?: FilterColumnResult
  ) => Promise<{ data: { items: unknown[]; totalCount: number } }>;
  filterProperty: string;
  rowCount?: number;
  showProperty: string;
  type: 'select-async';
};
export type BooleanColumnFilter = {
  placeholder?: string;
  type: 'boolean';
};
export type StandartColumnFilter = {
  type: 'string' | 'number' | 'date';
};
export type valueType<T> = {
  value: T;
};
export interface IFilterColumnProps {
  column: ColumnFilter;
  setFilteredColumns: Dispatch<React.SetStateAction<ColumnFilter[]>>;
  filterType: DataTableProps<unknown>['filterType'];
}
const BadgeWithDelete = ({
  badgeText,
  handleDelete,
}: {
  badgeText: string;
  handleDelete: () => void;
}) => (
  <Badge variant="outline" className="rounded-full px-3 py-1 mb-2 mr-2">
    {badgeText}
    <Button
      variant="ghost"
      className="p-0 ml-2 h-auto"
      onClick={() => handleDelete()}
    >
      <Cross1Icon className="size-3" />
    </Button>
  </Badge>
);

function DropDownCTA({
  column,
  selectedRows,
}: {
  column: ColumnFilter;
  selectedRows?: Record<string, unknown>[];
}) {
  let { value } = column;
  if (column.type === 'select-multiple') {
    value = value.split(',').length > 2 ? `${value.split(',')[0]}, ...` : value;
  } else if (column.type === 'date') {
    value = new Date(column.value).toLocaleDateString();
  } else if (column.type === 'boolean') {
    value = '';
  } else if (
    column.type === 'select-async' &&
    selectedRows &&
    selectedRows.length > 0
  ) {
    const { showProperty } = column;
    value =
      selectedRows?.length > 2
        ? `${selectedRows[0][showProperty]}, ...`
        : `${selectedRows[0][showProperty]}`;
  } else if (
    column.type === 'select-async' &&
    selectedRows &&
    selectedRows.length === 0
  ) {
    value = '';
  }

  return (
    <>
      <span className="font-semibold">{column.displayName}</span>:{' '}
      <span className="font-normal">{value}</span>
    </>
  );
}

export default function FilterColumn({
  column,
  setFilteredColumns,
  filterType,
}: IFilterColumnProps) {
  const [filteredValue, setFilteredValue] = useState<string>(column.value);
  const [isDropdownOpen, setIsDropdownOpen] = useState(!column.value);
  const [selectedRows, setSelectedRows] = useState<unknown[]>([]);
  const [data, setData] = useState<{ items: unknown[]; totalCount: number }>({
    items: [],
    totalCount: 0,
  });
  const isColumn = filterType === 'Column';

  useEffect(() => {
    if (column.type === 'select-async') {
      setData({
        items: column.data,
        totalCount: column.rowCount || 0,
      });
    }
  }, []);

  useEffect(() => {
    if (column.type === 'boolean') {
      setFilteredValue(column.value ? 'true' : 'false');
      return;
    }
    setFilteredValue(column.value);
  }, [column.value]);

  function handleSave() {
    if (!filteredValue && column.type !== 'boolean') {
      handleDelete();
      return;
    }

    setFilteredColumns((val) => {
      const temp = [...val];
      const index = temp.findIndex((item) => item.name === column.name);
      temp[index] = { ...temp[index], value: filteredValue };
      return temp;
    });
    setIsDropdownOpen(false);
  }
  function handleDelete() {
    setFilteredColumns((val) => {
      const index = val.findIndex((item) => item.name === column.name);
      val.splice(index, 1);
      const temp = [...val];
      return temp;
    });
    setIsDropdownOpen(false);
  }
  function handleOpenChange(open: boolean) {
    if (!open && !filteredValue) {
      handleDelete();
    }
    setIsDropdownOpen(open);
  }

  const handleRemoveAllSelectedRows = () => {
    setSelectedRows([]);
    setFilteredValue('');
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <>
      {column.type === 'select-async' ? (
        <CustomTableActionDialog
          type="Sheet"
          action={{
            cta: 'Submit',
            description: 'Submit',
            loadingContent: <div>Loading...</div>,
            type: 'Sheet',
            componentType: 'CustomComponent',
            content: (
              <>
                selected Rows
                <br />
                {selectedRows && selectedRows.length >= 2 && (
                  <Badge
                    variant="outline"
                    className="rounded-full cursor-pointer hover:bg-gray-50 transition mr-2"
                    onClick={handleRemoveAllSelectedRows}
                  >
                    Clear All
                  </Badge>
                )}
                {selectedRows.map((row) => {
                  const _row = row as Record<string, unknown>;
                  if (column.type !== 'select-async') return row;
                  const propertyName: string = column.showProperty;
                  if (row && typeof row === 'object' && propertyName in row)
                    return (
                      <BadgeWithDelete
                        badgeText={_row[propertyName] as string}
                        handleDelete={() => {
                          const filteredRows = [
                            ...selectedRows.filter((r) => r !== row),
                          ];
                          const getFilteredValues = filteredRows
                            .map((row) => {
                              const _row = row as Record<string, unknown>;
                              if (column.type !== 'select-async') return row;
                              const propertyName: string =
                                column.filterProperty;
                              if (
                                row &&
                                typeof row === 'object' &&
                                propertyName in row
                              )
                                return _row[propertyName];
                              return row;
                            })
                            .join(',');
                          setSelectedRows(filteredRows);
                          setFilteredValue(getFilteredValues);
                        }}
                      />
                    );
                  return 'not found';
                })}
                <DataTable
                  columnsData={{
                    type: 'Auto',
                    data: {
                      ...column.columnDataType,
                      selectable: true,
                      onSelect({ row, value, all }) {
                        if (value === false && all) {
                          setSelectedRows([]);
                          setFilteredValue('');
                          return;
                        }
                        if (value === false) {
                          setSelectedRows([
                            ...selectedRows.filter((r) => r !== row),
                          ]);
                          setFilteredValue(
                            [...selectedRows.filter((r) => r !== row)]
                              .map((row) => {
                                const _row = row as Record<string, unknown>;
                                if (column.type !== 'select-async') return row;
                                const propertyName: string =
                                  column.filterProperty;
                                if (
                                  row &&
                                  typeof row === 'object' &&
                                  propertyName in row
                                )
                                  return _row[propertyName];
                                return row;
                              })
                              .join(',')
                          );
                          return;
                        }
                        if (value === true && all) {
                          const _rows = row as unknown[];
                          const selectedRowsLocal = [...selectedRows];
                          _rows.forEach((r) => {
                            const isRowAdded = selectedRowsLocal.some(
                              (currentRow) => Object.is(currentRow, r)
                            );
                            if (isRowAdded) return;
                            selectedRowsLocal.push(r);
                          });
                          setSelectedRows(selectedRowsLocal);
                          setFilteredValue(
                            selectedRowsLocal
                              .map((row) => {
                                const _row = row as Record<string, unknown>;
                                if (column.type !== 'select-async') return row;
                                const propertyName: string =
                                  column.filterProperty;
                                if (
                                  row &&
                                  typeof row === 'object' &&
                                  propertyName in row
                                )
                                  return _row[propertyName];
                                return row;
                              })
                              .join(',')
                          );
                          return;
                        }
                        if (!row) return;
                        const isRowAdded = selectedRows.some((currentRow) =>
                          Object.is(currentRow, row)
                        );
                        if (isRowAdded) return;
                        setSelectedRows([...selectedRows, row]);
                        setFilteredValue(
                          [...selectedRows, row]
                            .map((row) => {
                              const _row = row as Record<string, unknown>;
                              if (column.type !== 'select-async') return row;
                              const propertyName: string =
                                column.filterProperty;
                              if (
                                row &&
                                typeof row === 'object' &&
                                propertyName in row
                              )
                                return _row[propertyName];
                              return row;
                            })
                            .join(',')
                        );
                      },
                    },
                  }}
                  showView={false}
                  rowCount={data.totalCount}
                  data={data.items}
                  fetchRequest={({ page, filter }) => {
                    if (column.fetchRequest) {
                      column.fetchRequest(page, filter).then((response) => {
                        setData({ ...response.data });
                      });
                    }
                  }}
                  detailedFilter={column.detailedFilters}
                />
                <Button
                  onClick={() => {
                    setIsDialogOpen(false);
                    handleSave();
                  }}
                >
                  Save
                </Button>
              </>
            ),
          }}
          open={isDialogOpen}
          onOpenChange={(state) => {
            setIsDialogOpen(state);
            setIsDropdownOpen(state);
            handleOpenChange(state);
          }}
        />
      ) : null}
      {isColumn ? (
        <FilterDropDownContent
          column={column}
          setFilteredValue={setFilteredValue}
          filteredValue={filteredValue}
          handleDelete={() => handleDelete()}
          handleSave={() => handleSave()}
          setIsDropdownOpen={setIsDropdownOpen}
          setIsDialogOpen={setIsDialogOpen}
          filterType={filterType}
        />
      ) : (
        <DropdownMenu
          open={isDropdownOpen}
          onOpenChange={(open) => {
            handleOpenChange(open);
          }}
        >
          {column.value !== '' ? (
            <Badge variant="outline" className="rounded-full px-3 py-1 mr-2">
              <DropdownMenuTrigger>
                <DropDownCTA
                  column={column}
                  selectedRows={selectedRows as Record<string, unknown>[]}
                />
              </DropdownMenuTrigger>
              <Button
                variant="ghost"
                className="p-0 ml-2 h-auto"
                onClick={() => handleDelete()}
              >
                <Cross1Icon className="size-3" />
              </Button>
            </Badge>
          ) : (
            <DropdownMenuTrigger />
          )}

          <DropdownMenuContent className="sm:max-w-md p-2">
            <FilterDropDownContent
              column={column}
              setFilteredValue={setFilteredValue}
              filteredValue={filteredValue}
              handleDelete={() => handleDelete()}
              handleSave={() => handleSave()}
              setIsDropdownOpen={setIsDropdownOpen}
              setIsDialogOpen={setIsDialogOpen}
              filterType={filterType}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}

function GenerateFilterByType({
  column,
  setFilteredValue,
  filteredValue,
  openDialog,
  filterType,
}: {
  column: ColumnFilter;
  filteredValue: string;
  openDialog: (open: boolean) => void;
  setFilteredValue: Dispatch<React.SetStateAction<string>>;
  filterType?: DataTableProps<unknown>['filterType'];
}) {
  const columnType = column.type;
  switch (columnType) {
    case 'string':
    case 'number':
      return (
        <Input
          id="name"
          className="col-span-3"
          onChange={(e) => {
            setFilteredValue(e.target.value);
          }}
          value={filteredValue}
          type={column.type === 'number' ? 'number' : 'text'}
          autoComplete="off"
        />
      );
    case 'date':
      return (
        <AdvancedCalendar
          initialFocus
          mode="single"
          onSelect={(value) => {
            setFilteredValue(value?.toISOString() || '');
          }}
          selected={filteredValue ? new Date(filteredValue) : undefined}
        />
      );
    case 'select':
      return (
        <Select onValueChange={(value) => setFilteredValue(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={column.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {column.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'boolean':
      return (
        <div className="flex items-center space-x-2">
          <Switch
            id={`${column.name}_filter`}
            defaultChecked={
              column.value === '' ? false : column.value === 'true'
            }
            onCheckedChange={(value) =>
              setFilteredValue(value ? 'true' : 'false')
            }
          />
          {column.placeholder && (
            <Label htmlFor={`${column.name}_filter`}>
              {column.placeholder}
            </Label>
          )}
        </div>
      );
    case 'select-multiple': {
      const defaultValue = [...filteredValue.split(',')];
      return (
        <MultiSelect
          {...column.multiSelectProps}
          {...column.htmlProps}
          defaultValue={defaultValue}
          onValueChange={(value) => {
            if (value.length === 0) {
              return;
            }
            setFilteredValue(value.toString());
          }}
        />
      );
    }
    case 'select-async': {
      if (filterType === 'Column') {
        return (
          <Button
            onClick={() => {
              openDialog(false);
            }}
          >
            Seç
          </Button>
        );
      }
      openDialog(false);
      break;
    }
    default: {
      const exhaustiveCheck: never = columnType;
      throw new Error(`Unhandled filter case: ${exhaustiveCheck}`);
    }
  }
}

export function FilterDropDownContent({
  column,
  setFilteredValue,
  filteredValue,
  handleDelete,
  handleSave,
  setIsDropdownOpen,
  setIsDialogOpen,
  filterType,
}: {
  column: ColumnFilter;
  setFilteredValue: Dispatch<React.SetStateAction<string>>;
  filteredValue: string;
  handleDelete: () => void;
  handleSave: () => void;
  setIsDropdownOpen: Dispatch<React.SetStateAction<boolean>>;
  setIsDialogOpen: Dispatch<React.SetStateAction<boolean>>;
  filterType?: DataTableProps<unknown>['filterType'];
}) {
  return (
    <>
      <div className="flex flex-row justify-between items-center mb-2">
        <Label htmlFor="name">{column.displayName}</Label>
        <Button variant="ghost" onClick={() => handleDelete()}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-row items-center gap-2 justify-center mb-2">
        <GenerateFilterByType
          column={column}
          setFilteredValue={setFilteredValue}
          filteredValue={filteredValue}
          filterType={filterType}
          openDialog={(open) => {
            setIsDropdownOpen(open);
            setIsDialogOpen(!open);
          }}
        />
      </div>
      {/* {filterType === 'Column' ? <> </> : */}
      <Button
        variant="secondary"
        onClick={() => handleSave()}
        className="w-full"
      >
        Filtrele
      </Button>
      {/* } */}
    </>
  );
}
