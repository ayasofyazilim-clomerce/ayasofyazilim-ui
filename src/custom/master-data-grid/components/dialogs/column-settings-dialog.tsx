"use no memo";

import type { Column, Table as TanStackTable } from "@tanstack/react-table";
import { Button } from "../../../../components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../../components/dialog";
import { ScrollArea } from "../../../../components/scroll-area";
import { Separator } from "../../../../components/separator";
import { Switch } from "../../../../components/switch";
import { Label } from "../../../../components/label";
import { getColumnName, getTranslations } from "../../utils/translation-utils";
import { MasterDataGridResources } from "../../types";

interface ColumnSettingsDialogProps<TData> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TanStackTable<TData>;
  t?: MasterDataGridResources;
}

export function ColumnSettingsDialog<TData>({
  open,
  onOpenChange,
  table,
  t,
}: ColumnSettingsDialogProps<TData>) {
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());

  const handleToggleVisibility = (column: Column<TData>, value: boolean) => {
    column.toggleVisibility(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {getTranslations("columnSettings.title", t)}
          </DialogTitle>
          <DialogDescription>
            {getTranslations("columnSettings.description", t)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.toggleAllColumnsVisible(true)}
            >
              {getTranslations("columnSettings.showAll", t)}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.toggleAllColumnsVisible(false)}
            >
              {getTranslations("columnSettings.hideAll", t)}
            </Button>
          </div>

          <Separator />

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {hideableColumns.map((column) => (
                <div
                  key={column.id}
                  className="flex items-center justify-between gap-3"
                >
                  <Label
                    htmlFor={`column-${column.id}`}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {getColumnName(column, t)}
                  </Label>
                  <Switch
                    id={`column-${column.id}`}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      handleToggleVisibility(column, value)
                    }
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
