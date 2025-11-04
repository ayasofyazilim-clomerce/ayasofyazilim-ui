import {
  TanstackTableLanguageDataType,
  TanstackTableLanguageDataTypeWithConstantKey,
} from "../types";

const isTypeLanguageDataTypeWithConstantKey = (
  value: object
): value is TanstackTableLanguageDataTypeWithConstantKey =>
  value && typeof value !== "undefined" && "constantKey" in value;

export function tanstackTableCreateTitleWithLanguageData({
  languageData,
  accessorKey,
}: {
  accessorKey: string;
  languageData?:
    | TanstackTableLanguageDataType
    | TanstackTableLanguageDataTypeWithConstantKey;
}): string {
  if (languageData && isTypeLanguageDataTypeWithConstantKey(languageData)) {
    const { constantKey, languageData: res } = languageData;
    return res[`${constantKey}.${accessorKey}`] || accessorKey;
  }

  return languageData?.[accessorKey] || accessorKey;
}
