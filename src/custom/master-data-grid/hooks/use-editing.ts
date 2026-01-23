import { useCallback, useRef } from "react";

export interface UseEditingProps<TData> {
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  onDataChange?: (data: TData[]) => void;
  editingRows: Record<string, Record<string, unknown>>;
  setEditingRows: (
    updater: (
      prev: Record<string, Record<string, unknown>>
    ) => Record<string, Record<string, unknown>>
  ) => void;
  editing?: {
    isRowEditable?: (row: TData) => boolean;
    onRowSave?: (row: TData, changes: Partial<TData>) => void | Promise<void>;
    onRowCancel?: (row: TData) => void;
  };
}

export interface UseEditingReturn<TData> {
  editingRowsRef: React.RefObject<Record<string, Record<string, unknown>>>;
  startEditingRow: (rowId: string, row: TData) => void;
  cancelEditingRow: (rowId: string, row: TData) => void;
  saveEditingRow: (rowId: string, row: TData) => Promise<void>;
  updateCellValue: (rowId: string, columnId: string, value: unknown) => void;
}

export function useEditing<TData>({
  data,
  getRowId,
  onDataChange,
  editingRows,
  setEditingRows,
  editing,
}: UseEditingProps<TData>): UseEditingReturn<TData> {
  const editingRowsRef = useRef<Record<string, Record<string, unknown>>>({});
  editingRowsRef.current = editingRows;

  const startEditingRow = useCallback(
    (rowId: string, row: TData) => {
      if (editing?.isRowEditable && !editing.isRowEditable(row)) {
        return;
      }
      setEditingRows((prev) => ({ ...prev, [rowId]: {} }));
    },
    [editing, setEditingRows]
  );

  const cancelEditingRow = useCallback(
    (rowId: string, row: TData) => {
      setEditingRows((prev) => {
        const { [rowId]: removed, ...rest } = prev;
        return rest;
      });
      editing?.onRowCancel?.(row);
    },
    [editing, setEditingRows]
  );

  const saveEditingRow = useCallback(
    async (rowId: string, row: TData) => {
      const changes = editingRowsRef.current[rowId] || {};
      const typedChanges = changes as Partial<TData>;

      if (editing?.onRowSave) {
        await editing.onRowSave(row, typedChanges);
      }
      if (onDataChange && Object.keys(changes).length > 0) {
        const updatedData = data.map((item) => {
          const itemId = getRowId
            ? getRowId(item, data.indexOf(item))
            : String(data.indexOf(item));
          return itemId === rowId ? { ...item, ...typedChanges } : item;
        });
        onDataChange(updatedData);
      }

      setEditingRows((prev) => {
        const { [rowId]: removed, ...rest } = prev;
        return rest;
      });
    },
    [data, onDataChange, getRowId, editing, setEditingRows]
  );

  const updateCellValue = useCallback(
    (rowId: string, columnId: string, value: unknown) => {
      setEditingRows((prev) => ({
        ...prev,
        [rowId]: {
          ...prev[rowId],
          [columnId]: value,
        },
      }));
    },
    [setEditingRows]
  );

  return {
    editingRowsRef,
    startEditingRow,
    cancelEditingRow,
    saveEditingRow,
    updateCellValue,
  };
}
