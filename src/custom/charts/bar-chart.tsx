'use client';

import * as React from 'react';
import {
  Bar,
  CartesianGrid,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@repo/ayasofyazilim-ui/components/chart';
import { cn } from '@repo/ayasofyazilim-ui/lib/utils';
import { CardClassNames, ChartCard } from './chart-card';
import { ChartData } from '.';
import { BaseAxisProps } from 'recharts/types/util/types';

export type BarChartProps = {
  data: ChartData;
  config: ChartConfig;
  xAxisKey: string;
  layout?: 'vertical' | 'horizontal';
  title?: React.ReactNode;
  description?: React.ReactNode;
  period?: React.ReactNode;
  footer?: React.ReactNode;
  trendText?: React.ReactNode;
  showLegend?: boolean;
  trendIcon?: React.ReactNode;
  xAxisTickFormatter?: BaseAxisProps["tickFormatter"];
  yAxisTickFormatter?: BaseAxisProps["tickFormatter"];
  valuePrefix?: string;
  valueSuffix?: string;
  classNames?: {
    chart?: {
      container?: string;
      bar?: string;
      legend?: string;
    };
    card?: CardClassNames;
  };
};

export function BarChart({
  data,
  config,
  xAxisKey,
  layout = 'vertical',
  title,
  description,
  period,
  footer,
  trendText,
  trendIcon,
  xAxisTickFormatter = (value) => value,
  yAxisTickFormatter = (value) => value,
  classNames,
  showLegend,
  valuePrefix,
  valueSuffix,
}: BarChartProps) {
  return (
    <ChartCard
      title={title}
      description={description}
      period={period}
      footer={footer}
      trendText={trendText}
      trendIcon={trendIcon}
      classNames={classNames?.card}
    >
      <ChartContainer
        config={config}
        className={cn('mx-auto max-h-full', classNames?.chart?.container)}
      >
        <RechartsBarChart
          accessibilityLayer
          data={data}
          layout={layout === 'horizontal' ? 'vertical' : 'horizontal'}
          className={cn('flex flex-col pb-2', classNames?.chart?.bar)}
          margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
        >
          <CartesianGrid vertical={false} />
          {layout === 'horizontal' ? (
            <>
              {Object.keys(config).map((key) => (
                <XAxis type="number" dataKey={key} key={key} />
              ))}

              <YAxis
                dataKey={xAxisKey}
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={yAxisTickFormatter}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={xAxisTickFormatter}
              />
              <YAxis />
            </>
          )}
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel={layout === 'horizontal'}
                valuePrefix={valuePrefix}
                valueSuffix={valueSuffix}
              />
            }
          />
          {Object.keys(config).map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={config[key]?.color || 'var(--chart-1)'}
              radius={layout === 'horizontal' ? 5 : 0}
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
        </RechartsBarChart>
      </ChartContainer>
    </ChartCard>
  );
}
