import type { Table } from "@tanstack/react-table";

import { useIsMobile } from "@repo/ayasofyazilim-ui/hooks/use-mobile";
import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../../../../components/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components/popover";
import type { MasterDataGridConfig } from "../../types";
import { getTranslations } from "../../utils/translation-utils";
import { ClientFilterContent } from "./client-filter";

export interface BaseMultiFilterDialogProps<TData> {
  table: Table<TData>;
  config: MasterDataGridConfig<TData>;
}
interface MultiFilterDialogProps<TData>
  extends BaseMultiFilterDialogProps<TData> {
  children: React.ReactNode;
}

export function MultiFilterDialog<TData>({
  table,
  config,
  children,
}: MultiFilterDialogProps<TData>) {
  const { t } = config;
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const filterContent = (
    <ClientFilterContent setOpen={setOpen} table={table} config={config} />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{getTranslations("filter.title", t)}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
            {filterContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto max-w-3xl" align="end">
        {filterContent}
      </PopoverContent>
    </Popover>
  );
}
