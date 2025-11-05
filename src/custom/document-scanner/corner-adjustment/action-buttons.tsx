import { memo } from "react";
import { ActionButtonsProps } from "./types";
import { Button } from "@repo/ayasofyazilim-ui/components/button";

export const ActionButtons = memo<ActionButtonsProps>(
  ({
    allowCrop,
    allowRetry,
    cropButtonText,
    retryButtonText,
    onCrop,
    onRetry,
  }) => {
    if (!allowCrop && !allowRetry) return null;

    return (
      <div className="absolute bottom-2 right-2 flex gap-2">
        {allowRetry && (
          <Button type="button" variant="outline" onClick={onRetry} size="sm">
            {retryButtonText}
          </Button>
        )}
        {allowCrop && (
          <Button onClick={onCrop} size="sm">
            {cropButtonText}
          </Button>
        )}
      </div>
    );
  }
);

ActionButtons.displayName = "ActionButtons";
