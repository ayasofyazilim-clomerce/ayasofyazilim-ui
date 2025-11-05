import {
  CalendarDate,
  DateValue,
  parseDate,
  parseTime,
  Time,
} from "@internationalized/date";

export function createDate({
  date,
  // timezone,
  offset,
}: {
  date: Date | undefined;
  // timezone: string;
  offset: number;
}): CalendarDate | DateValue | undefined {
  if (date)
    return parseDate(
      new Date(date.getTime() - offset).toJSON().split("T").at(0) || ""
    );
  return undefined;
}

export function createTime({
  date,
  offset,
}: {
  date: Date | undefined;
  offset: number;
}): Time {
  if (date)
    return parseTime(
      new Date(date.getTime() - offset)
        .toJSON()
        .split("T")
        .at(1)
        ?.replace("Z", "") || ""
    );

  return parseTime("00:00");
}
