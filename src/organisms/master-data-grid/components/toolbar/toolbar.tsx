import type { Table as TanStackTable } from '@tanstack/react-table';
import {
    Columns3,
    Download,
    Filter,
    RefreshCw
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../components/button';
import { ButtonGroup } from '../../../../components/button-group';
import { Input } from '../../../../components/input';
import type { MasterDataGridConfig } from '../../types';
import { getTranslations } from '../../utils/translation-utils';
import { MultiFilterDialog } from '../filters';

interface ToolbarProps<TData> {
    table: TanStackTable<TData>;
    config: MasterDataGridConfig<TData>;
    selectedRows: TData[];
    onExport?: (format: string) => void;
    onRefresh?: () => void;
    onOpenColumnSettings?: () => void;
}

/**
 * Data grid toolbar with actions and global search
 */
export function Toolbar<TData>({
    table,
    config,
    selectedRows,
    onExport,
    onRefresh,
    onOpenColumnSettings,
}: ToolbarProps<TData>) {
    const { t, tableActions, enableExport } = config;

    // Local state for search input to make it responsive
    const [searchValue, setSearchValue] = useState<string>('');

    // Sync with table state
    useEffect(() => {
        const currentFilter = table.getState().globalFilter as string;
        if (currentFilter !== searchValue) {
            setSearchValue(currentFilter ?? '');
        }
    }, [table.getState().globalFilter]);

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
        table.setGlobalFilter(value);
    };

    return (
        <div className="flex items-center justify-between gap-4 w-full">
            <Input
                placeholder={getTranslations('toolbar.search', t)}
                value={searchValue}
                onChange={event => handleSearchChange(event.target.value)}
                className="max-w-sm"
            />
            {selectedRows.length > 0 && (
                <div className="text-sm text-muted-foreground">
                    {selectedRows.length} {getTranslations('toolbar.selected', t)}
                </div>
            )}
            <ButtonGroup>
                {config.enableFiltering && (
                    <MultiFilterDialog table={table} t={config.t}>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            <span>{getTranslations('toolbar.filters', t)}</span>
                            {table.getState().columnFilters.length > 0 && (
                                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                    {table.getState().columnFilters.length}
                                </span>
                            )}
                        </Button>
                    </MultiFilterDialog>
                )}
                {config.enableColumnVisibility && (
                    <Button
                        variant="outline"
                        onClick={onOpenColumnSettings}
                    >
                        <Columns3 className="mr-2 h-4 w-4" />
                        <span>{getTranslations('toolbar.columns', t)}</span>
                    </Button>
                )}
                {tableActions?.map(action => {
                    const disabled = typeof action.disabled === 'function'
                        ? action.disabled(selectedRows)
                        : action.disabled;

                    const hidden = typeof action.hidden === 'function'
                        ? action.hidden(selectedRows)
                        : action.hidden;

                    if (hidden) return null;

                    // Only show if not requiring selection or if rows are selected
                    if (action.requiresSelection && selectedRows.length === 0) {
                        return null;
                    }

                    const Icon = action.icon;

                    return (
                        <Button
                            key={action.id}
                            variant={action.variant}
                            disabled={disabled}
                            onClick={() => action.onClick?.(selectedRows)}
                            className={action.className}
                        >
                            {Icon && <Icon />}
                            {action.label}
                        </Button>
                    );
                })}
                {enableExport && onExport && (
                    <Button
                        variant="outline"
                        onClick={() => onExport('csv')}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        <span>{getTranslations('toolbar.export', t)}</span>
                    </Button>
                )}
                {onRefresh && (
                    <Button
                        variant="outline"
                        onClick={onRefresh}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        <span>{getTranslations('toolbar.refresh', t)}</span>
                    </Button>
                )}
            </ButtonGroup>
        </div>
    );
}
