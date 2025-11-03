export const alphanumericKeys = /^[a-z0-9@.]$/i;

export function cleanValue(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function getHonestValue(
  value: unknown,
  maxValue: number,
  defaultValue: number,
) {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value <= maxValue
  ) {
    return value;
  }
  return defaultValue;
}

export function isFn(fn: unknown) {
  return typeof fn === "function";
}

export function getEmailData(value: string, minChars: number) {
  const [username] = value.split("@");
  const breakpoint = value.indexOf("@");
  const domain = breakpoint >= 0 ? value.slice(breakpoint + 1) : ""; // Domain is truthy only if typed @

  const hasUsername = username ? username.length >= minChars : false;
  const hasAt = hasUsername && value.includes("@");
  const hasDomain = hasUsername && domain.length >= 1;

  return { username, domain, hasUsername, hasAt, hasDomain };
}
