"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ayasofyazilim-ui/components/dialog";
import { SchemaForm } from "@repo/ayasofyazilim-ui/custom/schema-form";
import { TanstackTableActionsSchemaFormDialog } from "../types";
import { useCallback, useState } from "react";

type TanstackTableSchemaFormDialogProps<TData> = {
  setDialogOpen: () => void;
} & TanstackTableActionsSchemaFormDialog<TData>;
export function TanstackTableTableSchemaFormDialog<TData>(
  props: TanstackTableSchemaFormDialogProps<TData>
) {
  const { title, setDialogOpen, onSubmit } = props;
  const [formData, setFormData] = useState<TData>(props.formData as TData);
  const handleFormChange = useCallback(
    ({ formData: editedFormData }: { formData?: TData }) => {
      if (editedFormData) {
        setFormData(editedFormData);
      }
    },
    []
  );
  return (
    <Dialog open onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <SchemaForm
          {...props}
          formData={formData}
          onChange={handleFormChange}
          onSubmit={(data) => {
            onSubmit(data.formData);
            setDialogOpen();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
