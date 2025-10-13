import { Column } from '@tanstack/react-table';
import { CSSProperties } from 'react';

export function getCommonPinningStyles<TData>({
  column,
  fillerColumn,
  withBorder,
  resizeable,
}: {
  resizeable?: boolean;
  column: Column<TData>;
  fillerColumn?: keyof TData;

  /**
   * Show box shadow between pinned and scrollable columns.
   * @default false
   */
  withBorder?: boolean;
}): CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left');
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right');
  return {
    boxShadow: withBorder
      ? isLastLeftPinnedColumn
        ? '-4px 0 4px -4px hsl(var(--border)) inset'
        : isFirstRightPinnedColumn
          ? '4px 0 4px -4px hsl(var(--border)) inset'
          : undefined
      : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    opacity: isPinned ? 0.97 : 1,
    width:
      !resizeable && fillerColumn === column.id ? '100%' : column.getSize(),
    position: isPinned ? 'sticky' : 'relative',
    background: isPinned ? 'hsl(var(--background))' : '',
    zIndex: isPinned ? 1 : 0,
    textWrap: 'nowrap',
  };
}
