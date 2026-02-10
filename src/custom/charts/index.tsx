export * from "./pie-chart";
export * from "./area-chart";
export * from "./radar-chart";
export * from "./bar-chart";

export type ChartData = Array<{
  [key: string]: number | string;
}>;

export type EmptyConfig = {
  emptyState: {
    icon: React.ReactNode;
    title: string;
    description: string;
  };
}