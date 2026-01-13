"use no memo"
import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronDown, EyeOff, FilterIcon, PinIcon, PinOffIcon } from 'lucide-react';
import { Button } from '../../../../components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../../../components/dropdown-menu';
import { getTranslations } from '../../utils/translation-utils';
import { InlineColumnFilter } from '../filters';

interface HeaderCellProps<TData> {
    column: Column<TData>;
    label: string;
    t?: Record<string, string>;
    onFilterClick?: (columnId: string) => void;
}

/**
 * Table header cell with sorting, pinning, and visibility options
 */
export function HeaderCell<TData>({ column, label, t, onFilterClick }: HeaderCellProps<TData>) {
    const isSorted = column.getIsSorted();
    const isPinned = column.getIsPinned();

    return (
        <div className="flex items-center size-full">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="data-[state=open]:bg-accent w-full rounded-none"
                    >
                        <span className="font-semibold mr-auto truncate">{label}</span>
                        {isSorted === 'asc' ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : isSorted === 'desc' ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {column.getCanSort() && (
                        <>
                            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                                <ArrowUp className="mr-2 h-4 w-4" />
                                {getTranslations('column.sortAsc', t)}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                                <ArrowDown className="mr-2 h-4 w-4" />
                                {getTranslations('column.sortDesc', t)}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {column.getCanPin() && (
                        <>
                            <DropdownMenuItem onClick={() => column.pin('left')}>
                                <PinIcon className="mr-2 h-4 w-4" />{getTranslations('column.pinLeft', t)}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => column.pin('right')}>
                                <PinIcon className="mr-2 h-4 w-4" />{getTranslations('column.pinRight', t)}
                            </DropdownMenuItem>
                            {isPinned && (
                                <DropdownMenuItem onClick={() => column.pin(false)}>
                                    <PinOffIcon className="mr-2 h-4 w-4" />
                                    {getTranslations('column.unpin', t)}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {column.getCanFilter() && (
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className='flex items-center gap-4 font-normal'>
                                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                                {getTranslations('column.filter', t)}</DropdownMenuLabel>
                            <DropdownMenuItem className='p-0' asChild>
                                <InlineColumnFilter column={column} t={t} />
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    )}

                    {column.getCanHide() && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                                <EyeOff className="mr-2 h-4 w-4" />
                                {getTranslations('column.hide', t)}
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
