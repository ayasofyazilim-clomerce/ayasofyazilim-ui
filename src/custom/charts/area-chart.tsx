'use client';

import {
  Area,
  CartesianGrid,
  AreaChart as RechartsAreaChart,
  XAxis,
  YAxis,
} from 'recharts';

import { ReactNode } from 'react';
import { CurveType } from 'recharts/types/shape/Curve';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@repo/ayasofyazilim-ui/components/chart';
import { cn } from '@repo/ayasofyazilim-ui/lib/utils';
import { CardClassNames, ChartCard } from './chart-card';
import { BaseAxisProps } from 'recharts/types/util/types';

export const description = 'An area chart with a legend';

type ChartData = Array<{
  [key: string]: number | string;
}>;

type ChartConfig = {
  [key: string]: {
    label: string;
    type?: CurveType;
    color: string;
  };
};

export type AreaChartProps = {
  data: ChartData;
  config: ChartConfig;
  title?: ReactNode;
  description?: ReactNode;
  period?: ReactNode;
  footer?: ReactNode;
  trendText?: ReactNode;
  trendIcon?: ReactNode;
  showLegend?: boolean;
  xAxisTickFormatter?: BaseAxisProps["tickFormatter"]
  classNames?: {
    chart?: {
      container?: string;
      area?: string;
      legend?: string;
    };
    card?: CardClassNames;
  };
  valuePrefix?: string;
  valueSuffix?: string;
};

export function AreaChart({
  data,
  title,
  config,
  description,
  period,
  footer,
  trendText,
  trendIcon,
  showLegend,
  xAxisTickFormatter = (value) => value,
  classNames,
  valuePrefix,
  valueSuffix,
}: AreaChartProps) {
  return (
    <ChartCard
      title={title}
      description={description}
      period={period}
      trendText={trendText}
      trendIcon={trendIcon}
      footer={footer}
      classNames={classNames?.card}
    >
      <ChartContainer
        config={config}
        className={cn('mx-auto max-h-full', classNames?.chart?.container)}
      >
        <RechartsAreaChart
          accessibilityLayer
          data={data}
          className={cn('flex flex-col pb-2', classNames?.chart?.area)}
          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
        >
          <CartesianGrid vertical={false} />
          <>
            <XAxis
              dataKey="label"
              tickMargin={2}
              minTickGap={2}
              tickFormatter={xAxisTickFormatter}
            />
            <YAxis />
          </>
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
          {Object.keys(config).map((key) => (
            <Area
              key={key}
              dataKey={key}
              type={config[key]?.type || 'monotoneX'}
              fill={config[key]?.color || `var(--color-${key})`}
              fillOpacity={0.4}
              stroke={config[key]?.color || `var(--color-${key})`}
              stackId="a"
            />
          ))}
          {showLegend && (
            <ChartLegend
              wrapperStyle={{
                position: 'relative',
                top: 'unset',
                left: 'unset',
                bottom: 'unset',
                right: 'unset',
                width: '100%',
                textAlign: 'center',
              }}
              className={cn('p-0', classNames?.chart?.legend)}
              content={<ChartLegendContent />}
            />
          )}
        </RechartsAreaChart>
      </ChartContainer>
    </ChartCard>
  );
}
