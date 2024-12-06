import { ChevronDownIcon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import CustomTableActionDialog from '../dialog';
import FilterColumn, {
  ColumnFilter,
  IFilterColumnProps,
} from './filter-column';
import { normalizeName } from './utils';
import { ActionComponent, FilterButton, getCTA } from './helper-components';
import { DataTableProps, TableAction } from './types';
import { Badge } from '@/components/ui/badge';

const getNonSelectedFilters = (
  detailedFilter: DataTableProps<unknown>['detailedFilter'],
  filteredColumns: ColumnFilter[]
) =>
  detailedFilter?.filter(
    (column) => filteredColumns?.findIndex((f) => f.name === column.name) === -1
  ) || [];

export default function TableToolbar<TData>({
  inputProps,
  activeAction,
  isOpen,
  setIsOpen,
  triggerData,
  defaultAction,
  table,
  isMultipleActionProvided,
  filteredColumns,
  setTriggerData,
  setActiveAction,
  setFilteredColumns,
}: {
  activeAction: TableAction<TData> | undefined;
  defaultAction: TableAction | undefined;
  detailedFilter: DataTableProps<unknown>['detailedFilter'];
  filteredColumns: ColumnFilter[];
  inputProps: DataTableProps<TData>;
  isMultipleActionProvided: boolean;
  isOpen: boolean;
  setActiveAction: (value: TableAction | undefined) => void;
  setFilteredColumns: IFilterColumnProps['setFilteredColumns'];
  setIsOpen: (value: boolean) => void;
  setTriggerData: (value: TData | null) => void;
  table: Table<TData>;
  triggerData: TData;
}) {
  const {
    action,
    isLoading,
    showView = true,
    detailedFilter,
    classNames,
    filterType,
  } = inputProps;
  const isColumn = filterType === 'Column';
  const filterClass = isColumn ? 'flex flex-col gap-2' : '';
  return (
    <>
      {activeAction &&
        isOpen &&
        (activeAction.type === 'Dialog' || activeAction.type === 'Sheet') && (
          <CustomTableActionDialog<TData>
            open={isOpen}
            onOpenChange={setIsOpen}
            action={activeAction}
            type={activeAction?.type}
            triggerData={triggerData}
          />
        )}
      {(showView || defaultAction) && (
        <div
          className={cn(
            'flex items-center gap-2',
            classNames?.actions?.container
          )}
        >
          {showView === true &&
            (isLoading ? (
              <Skeleton className="ml-auto h-9 w-32" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    disabled={isLoading}
                    variant="outline"
                    className="ml-auto"
                  >
                    View <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {normalizeName(column.id)}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}

          <div className={cn('flex', classNames?.actions?.wrapper)}>
            {isLoading ? (
              <Skeleton className="w-36 h-9" />
            ) : (
              <ActionComponent
                action={defaultAction}
                callback={() => {
                  setTriggerData(null);
                  setActiveAction(defaultAction);
                  setIsOpen(true);
                }}
                className={isMultipleActionProvided ? 'rounded-r-none' : ''}
              />
            )}
            {isMultipleActionProvided &&
              action &&
              Array.isArray(action) &&
              action.length > 1 &&
              !isLoading && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      disabled={isLoading}
                      variant="outline"
                      className="rounded-l-none border-l-0 px-2"
                    >
                      <ChevronDownIcon className="" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {action
                      .filter((i) => i !== action[0])
                      .map((actionItem) => (
                        <DropdownMenuItem
                          asChild
                          key={getCTA(actionItem.cta, triggerData)}
                          className="cursor-pointer"
                        >
                          <ActionComponent
                            action={actionItem}
                            callback={() => {
                              setTriggerData(null);
                              setActiveAction(actionItem);
                              if (actionItem.type === 'Action') {
                                actionItem.callback(null);
                                return;
                              }
                              setIsOpen(true);
                            }}
                            className="w-full border-none"
                          />
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </div>
        </div>
      )}
      <FilterToolbar<TData>
        classNames={classNames}
        detailedFilter={detailedFilter}
        filteredColumns={filteredColumns}
        filterType={filterType}
        isLoading={isLoading || false}
        setFilteredColumns={setFilteredColumns}
        filterClass={filterClass}
      />
    </>
  );
}

function FilterToolbar<TData>({
  classNames,
  detailedFilter,
  filteredColumns,
  filterType,
  isLoading,
  setFilteredColumns,
  filterClass,
}: {
  classNames: DataTableProps<TData>['classNames'];
  detailedFilter: DataTableProps<TData>['detailedFilter'];
  filteredColumns: ColumnFilter[];
  filterType: DataTableProps<TData>['filterType'];
  isLoading: boolean;
  setFilteredColumns: IFilterColumnProps['setFilteredColumns'];
  filterClass: string;
}) {
  return (
    <div className={cn('my-3', classNames?.filters?.container, filterClass)}>
      {detailedFilter && (
        <div className={cn('flex', classNames?.filters?.items, filterClass)}>
          {filteredColumns && filteredColumns.length >= 2 && (
            <Badge
              variant="outline"
              className="rounded-full cursor-pointer hover:bg-gray-50 transition mr-2"
              onClick={() => setFilteredColumns([])}
            >
              Clear All
            </Badge>
          )}
          {filteredColumns &&
            filteredColumns.map((column) => (
              <FilterColumn
                filterType={filterType}
                key={column.name}
                column={column}
                setFilteredColumns={setFilteredColumns}
              />
            ))}
          {/* {filteredColumns && filterType === "Column" && (
             <Button
             variant="secondary"
             onClick={() => handleSave()}
             className="w-full"
           >
             Filtrele
           </Button>
          )} */}
          {getNonSelectedFilters(detailedFilter, filteredColumns).length >
            0 && (
            <FilterButton
              detailedFilter={detailedFilter}
              filteredColumns={filteredColumns}
              isLoading={isLoading}
              setFilteredColumns={setFilteredColumns}
            />
          )}
        </div>
      )}
    </div>
  );
}
