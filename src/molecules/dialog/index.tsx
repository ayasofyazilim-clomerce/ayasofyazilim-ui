'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AutoForm, { AutoFormSubmit } from '../../organisms/auto-form';
import { ScrollArea } from '@/components/ui/scroll-area';

export type TableAction = {
  autoFormArgs: any;
  callback: (values: any, triggerData: any) => void;
  cta: string;
  description: string;
};

export type AutoformDialogProps = {
  action?: TableAction;
  onOpenChange: (e: boolean) => void;
  open: boolean;
  triggerData?: any;
};

export default function AutoformDialog({
  open,
  onOpenChange,
  action,
  triggerData,
}: AutoformDialogProps) {
  const [values, setValues] = useState<any>(triggerData || {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] px-0">
        <ScrollArea>
          <div className="max-h-[70vh] px-6">
            <DialogHeader>
              <DialogTitle>{action?.cta}</DialogTitle>
              <DialogDescription>{action?.description}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 overflow-visible">
              <AutoForm
                {...action?.autoFormArgs}
                onParsedValuesChange={setValues}
                values={values}
                onSubmit={(formData) => action?.callback(formData, triggerData)}
              >
                {action?.autoFormArgs?.children}
                <AutoFormSubmit className="float-right">
                  <button type="submit">Save Changes</button>
                </AutoFormSubmit>
              </AutoForm>
            </div>
            <DialogFooter>
              {/* Additional Dialog Footer content can be added here */}
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
