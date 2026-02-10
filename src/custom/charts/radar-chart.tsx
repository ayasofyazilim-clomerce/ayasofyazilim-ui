"use client";

import * as React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
} from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ayasofyazilim-ui/components/chart";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { ChartCard, CardClassNames } from "./chart-card";
import { ChartData, EmptyConfig } from ".";

export type RadarChartProps = {
  data: ChartData;
  config: ChartConfig;
  polarKey: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  period?: React.ReactNode;
  footer?: React.ReactNode;
  trendText?: React.ReactNode;
  trendIcon?: React.ReactNode;
  showLegend?: boolean;
  linesOnly?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  classNames?: {
    chart?: {
      container?: string;
      tooltip?: string;
      legend?: string;
      radar?: string;
    };
    card?: CardClassNames;
  };
} & EmptyConfig;

export function RadarChart({
  data,
  config,
  polarKey,
  title,
  description,
  period,
  footer,
  trendText,
  trendIcon,
  showLegend = true,
  linesOnly = false,
  classNames,
  valuePrefix,
  valueSuffix,
  emptyState,
}: RadarChartProps) {
  return (
    <ChartCard
      title={title}
      description={description}
      period={period}
      footer={footer}
      trendText={trendText}
      trendIcon={trendIcon}
      classNames={classNames?.card}
      emptyState={data.length === 0 ? emptyState : undefined}

    >
      <ChartContainer
        config={config}
        className={cn("mx-auto max-h-full", classNames?.chart?.container)}
      >
        <RechartsRadarChart
          data={data}
          className={cn("flex flex-col pb-2", classNames?.chart?.radar)}
          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
        >
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator="line"
                valuePrefix={valuePrefix}
                valueSuffix={valueSuffix}
              />
            }
          />
          <PolarAngleAxis dataKey={polarKey} />
          <PolarGrid radialLines={!linesOnly} />
          {Object.keys(config).map((key, idx) => (
            <Radar
              key={key}
              dataKey={key}
              fill={config[key]?.color || `var(--color-${idx})`}
              fillOpacity={linesOnly ? 0 : idx === 0 ? 0.6 : 0.4}
              stroke={config[key]?.color || `var(--color-${idx})`}
              strokeWidth={linesOnly ? 2 : 1}
            />
          ))}
          {showLegend && (
            <ChartLegend
              wrapperStyle={{
                position: "relative",
                top: "unset",
                left: "unset",
                bottom: "unset",
                right: "unset",
                width: "100%",
                textAlign: "center",
              }}
              className={cn("p-0", classNames?.chart?.legend)}
              content={<ChartLegendContent />}
            />
          )}
        </RechartsRadarChart>
      </ChartContainer>
    </ChartCard>
  );
}
