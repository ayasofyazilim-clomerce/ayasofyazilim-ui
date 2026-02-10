import * as React from "react";
import { useMemo } from "react";
import { Label, LabelProps, Pie, PieChart as RechartsPieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ayasofyazilim-ui/components/chart";
import { CardClassNames, ChartCard } from "./chart-card";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { ChartData, EmptyConfig } from ".";

export type PieChartProps = {
  data: ChartData;
  config: ChartConfig;
  valueKey: string;
  nameKey: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  period?: React.ReactNode;
  trendText?: React.ReactNode;
  trendIcon?: React.ReactNode;
  footer?: React.ReactNode;
  totalLabel?: string;
  chartStyle: "donut" | "pie";
  innerRadius?: number;
  strokeWidth?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  showLegend?: boolean;
  classNames?: {
    chart?: {
      container?: string;
      tooltip?: string;
      legend?: string;
      pie?: string;
    };
    card?: CardClassNames;
  };
} & EmptyConfig;

export function PieChart({
  data,
  config,
  valueKey,
  nameKey,
  title,
  description,
  period,
  trendText,
  trendIcon,
  footer,
  totalLabel,
  chartStyle,
  classNames,
  innerRadius,
  strokeWidth,
  valuePrefix,
  valueSuffix,
  showLegend = true,
  emptyState,
}: PieChartProps) {
  const totalCount = useMemo(
    () => data.reduce((acc, curr) => acc + (Number(curr[valueKey]) || 0), 0),
    [data, valueKey]
  );

  // Transform data to ChartConfig shape for ChartContainer
  const renderLabelContent = ({
    viewBox,
  }: {
    viewBox?: LabelProps["viewBox"] | null;
  }) => {
    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
      return (
        <text
          x={viewBox.cx}
          y={viewBox.cy}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          <tspan
            x={viewBox.cx}
            y={viewBox.cy}
            className="fill-foreground text-3xl font-bold"
          >
            {valuePrefix} {totalCount.toLocaleString()} {valueSuffix}
          </tspan>
          <tspan
            x={viewBox.cx}
            y={(viewBox.cy || 0) + 24}
            className="fill-muted-foreground"
          >
            {totalLabel}
          </tspan>
        </text>
      );
    }
    return null;
  };

  return (
    <ChartCard
      title={title}
      description={description}
      period={period}
      footer={footer}
      trendText={trendText}
      trendIcon={trendIcon}
      classNames={classNames?.card}
      emptyState={emptyState}
    >
      <ChartContainer
        config={config}
        className={cn("max-h-[300px]", classNames?.chart?.container)}
      >
        <RechartsPieChart className={cn("relative", classNames?.chart?.pie)}>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                valuePrefix={valuePrefix}
                valueSuffix={valueSuffix}
              />
            }
          />
          <Pie
            data={data.map((item, index) => ({
              ...item,
              fill:
                config[String(item[nameKey])]?.color ||
                `var(--chart-${index + 1})`,
            }))}
            className="fixed"
            dataKey={valueKey}
            nameKey={nameKey}
            innerRadius={innerRadius || (chartStyle === "donut" ? 60 : 0)}
            strokeWidth={
              strokeWidth || (chartStyle === "donut" ? 0 : undefined)
            }
          >
            <Label content={renderLabelContent} />
          </Pie>
          {showLegend && (
            <ChartLegend
              wrapperStyle={{
                width: "100%",
                height: 0,
                bottom: 0,
              }}
              content={
                <ChartLegendContent className="flex-col absolute size-full inset-0 items-start justify-end w-full text-nowrap gap-1 p-0" />
              }
            />
          )}
        </RechartsPieChart>
      </ChartContainer>
    </ChartCard>
  );
}
