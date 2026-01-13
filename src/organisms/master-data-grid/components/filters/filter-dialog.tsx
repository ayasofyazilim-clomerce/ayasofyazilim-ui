import type { Column } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../../components/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../../../components/dialog';
import { Input } from '../../../../components/input';
import { Label } from '../../../../components/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../components/select';
import { getFilterOperators, validateFilterValue } from '../../utils/filter-fns';
import { getTranslations } from '../../utils/translation-utils';
import type { ColumnFilter, FilterOperator, JSONSchemaProperty, ColumnMeta } from '../../types';

interface FilterDialogProps<TData> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    column: Column<TData, unknown> | null;
    onApply: (filter: ColumnFilter) => void;
    onClear: () => void;
    t?: Record<string, string>;
}

/**
 * Advanced filter dialog with operator selection
 */
export function FilterDialog<TData>({
    open,
    onOpenChange,
    column,
    onApply,
    onClear,
    t,
}: FilterDialogProps<TData>) {
    const [operator, setOperator] = useState<FilterOperator>('contains');
    const [value, setValue] = useState<string>('');
    const [value2, setValue2] = useState<string>('');

    const meta = column?.columnDef.meta as ColumnMeta | undefined;
    const schemaProperty = meta?.schemaProperty;
    const filterOperators = meta?.filterOperators;

    // Memoize available operators to avoid recalculation
    // Only compute when dialog is open
    const availableOperators = useMemo<FilterOperator[]>(() => {
        if (!open) return ['contains'];
        return filterOperators ||
            (schemaProperty ? getFilterOperators(schemaProperty.type, schemaProperty.format) : ['contains']);
    }, [open, filterOperators, schemaProperty?.type, schemaProperty?.format]);

    // Reset when column changes
    useEffect(() => {
        if (column) {
            const currentFilter = column.getFilterValue() as ColumnFilter | undefined;
            if (currentFilter) {
                setOperator(currentFilter.operator);
                setValue(String(currentFilter.value || ''));
                setValue2(String(currentFilter.value2 || ''));
            } else {
                setOperator((availableOperators[0] || 'contains') as FilterOperator);
                setValue('');
                setValue2('');
            }
        }
    }, [column?.id]);

    const handleApply = () => {
        if (!column) return;

        const filter: ColumnFilter = {
            id: column.id,
            operator,
            value,
            value2: needsSecondValue ? value2 : undefined,
        };

        if (validateFilterValue(operator, value, value2)) {
            onApply(filter);
            onOpenChange(false);
        }
    };

    const handleClear = () => {
        onClear();
        setValue('');
        setValue2('');
        onOpenChange(false);
    };

    const needsSecondValue = operator === 'between' || operator === 'inRange';
    const needsValue = operator !== 'isEmpty' && operator !== 'isNotEmpty';

    // If no column is selected, show message to select from column header
    if (!column) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {getTranslations('filter.title', t)}
                        </DialogTitle>
                        <DialogDescription>
                            {getTranslations('filter.selectColumn', t)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            To apply filters:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 mt-2 text-sm">
                            <li>Find the column you want to filter</li>
                            <li>Click the filter icon in the column header</li>
                            <li>Select your filter operator and value</li>
                            <li>Click Apply</li>
                        </ol>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => onOpenChange(false)}>
                            {getTranslations('filter.close', t)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {getTranslations('filter.title', t)}
                    </DialogTitle>
                    <DialogDescription>
                        {getTranslations('filter.description', t)} {column.id}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Operator Selection */}
                    <div className="space-y-2">
                        <Label>{getTranslations('filter.operator', t)}</Label>
                        <Select value={operator} onValueChange={v => setOperator(v as FilterOperator)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableOperators.map(op => (
                                    <SelectItem key={op} value={op}>
                                        {getTranslations(`filter.operator.${op}`, t)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Value Input */}
                    {needsValue && (
                        <div className="space-y-2">
                            <Label>
                                {getTranslations('filter.value', t)}
                                {needsSecondValue && ' (From)'}
                            </Label>
                            <Input
                                value={value}
                                onChange={e => setValue(e.target.value)}
                                placeholder={getTranslations('filter.valuePlaceholder', t)}
                                type={schemaProperty?.type === 'number' || schemaProperty?.type === 'integer' ? 'number' : 'text'}
                            />
                        </div>
                    )}

                    {/* Second Value Input (for between/range) */}
                    {needsSecondValue && (
                        <div className="space-y-2">
                            <Label>{getTranslations('filter.value2', t)}</Label>
                            <Input
                                value={value2}
                                onChange={e => setValue2(e.target.value)}
                                placeholder={getTranslations('filter.value2Placeholder', t)}
                                type={schemaProperty?.type === 'number' || schemaProperty?.type === 'integer' ? 'number' : 'text'}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClear}>
                        {getTranslations('filter.clear', t)}
                    </Button>
                    <Button onClick={handleApply}>
                        {getTranslations('filter.apply', t)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
