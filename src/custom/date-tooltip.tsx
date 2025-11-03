"use client";

import React from "react";
import { ClockIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ayasofyazilim-ui/components/tooltip";

export type Localization = { locale: string; timeZone: string; lang: string };

function DateTooltip({
  icon = <ClockIcon className="w-4 h-4" />,
  date,
  dateOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  },
  localization,
}: {
  icon?: React.ReactNode;
  date: string | Date;
  dateOptions?: Intl.DateTimeFormatOptions;
  localization: Localization;
}) {
  const tenantDate = formatToLocalizedDate({
    localization,
    date,
    dateOptions,
    timeZone: localization.timeZone,
  });
  const utcDate = formatToLocalizedDate({
    localization,
    date,
    dateOptions,
    timeZone: "UTC",
  });
  const userDate = formatToLocalizedDate({ localization, date, dateOptions });
  return (
    <Tooltip>
      <TooltipTrigger className="flex items-center gap-1 underline decoration-dotted underline-offset-2">
        {icon} {tenantDate}
      </TooltipTrigger>
      <TooltipContent className="bg-gray-100 text-gray-900 border border-gray-300 z-100">
        <p className="flex justify-between">
          <span className="font-semibold mr-2">UTC:</span>
          {utcDate}
        </p>
        <p className="flex justify-between">
          <span className="font-semibold mr-2">Tenant:</span>
          {tenantDate}
        </p>
        <p className="flex justify-between">
          <span className="font-semibold mr-2">You:</span>
          {userDate}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export default DateTooltip;

export function formatToLocalizedDate({
  localization,
  date,
  dateOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  },
  timeZone,
}: {
  localization: Localization;
  date: string | Date;
  dateOptions?: Intl.DateTimeFormatOptions;
  timeZone?: string;
}) {
  const _date = typeof date === "string" ? new Date(date) : date;
  const dateString = _date.toLocaleDateString(localization.lang, {
    ...dateOptions,
    timeZone,
  });
  return dateString;
}
