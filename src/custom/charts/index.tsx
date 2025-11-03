export * from "./pie-chart";
export * from "./area-chart";
export * from "./radar-chart";
export * from "./bar-chart";

export type ChartData = Array<{
  [key: string]: number | string;
}>;
