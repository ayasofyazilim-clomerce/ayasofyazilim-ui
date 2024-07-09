// Tremor Raw AreaChart [v0.2.2]

'use client';

import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  Area,
  CartesianGrid,
  Dot,
  Label,
  Line,
  AreaChart as RechartsAreaChart,
  Legend as RechartsLegend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AxisDomain } from 'recharts/types/util/types';

import { useOnWindowResize } from '../../lib/hooks/useOnWindowResize';
import {
  AvailableChartColors,
  AvailableChartColorsKeys,
  constructCategoryColors,
  getColorClassName,
} from '../../lib/utils/chartColors';
import { cn } from '@/lib/utils';
import { getYAxisDomain } from '../../lib/utils/getYAxisDomain';
import { hasOnlyOneValueForKey } from '../../lib/utils/hasOnlyOneValueForKey';

// #region Legend

interface LegendItemProps {
  activeLegend?: string;
  color: AvailableChartColorsKeys;
  name: string;
  onClick?: (name: string, color: AvailableChartColorsKeys) => void;
}

const LegendItem = ({
  name,
  color,
  onClick,
  activeLegend,
}: LegendItemProps) => {
  const hasOnValueChange = !!onClick;
  return (
    <li
      className={cn(
        // base
        'group inline-flex flex-nowrap items-center gap-1.5 whitespace-nowrap rounded px-2 py-1 transition',
        hasOnValueChange ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(name, color);
      }}
    >
      <span
        className={cn(
          'h-[3px] w-3.5 shrink-0 rounded-full',
          getColorClassName(color, 'bg'),
          activeLegend && activeLegend !== name ? 'opacity-40' : 'opacity-100'
        )}
        aria-hidden
      />
      <p
        className={cn(
          // base
          'truncate whitespace-nowrap text-xs',
          // text color
          'text-gray-700',
          hasOnValueChange && 'group-hover:text-gray-900',
          activeLegend && activeLegend !== name ? 'opacity-40' : 'opacity-100'
        )}
      >
        {name}
      </p>
    </li>
  );
};

interface ScrollButtonProps {
  disabled?: boolean;
  icon: React.ElementType;
  onClick?: () => void;
}

const ScrollButton = ({ icon, onClick, disabled }: ScrollButtonProps) => {
  const Icon = icon;
  const [isPressed, setIsPressed] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isPressed) {
      intervalRef.current = setInterval(() => {
        onClick?.();
      }, 300);
    } else {
      clearInterval(intervalRef.current as NodeJS.Timeout);
    }
    return () => clearInterval(intervalRef.current as NodeJS.Timeout);
  }, [isPressed, onClick]);

  React.useEffect(() => {
    if (disabled) {
      clearInterval(intervalRef.current as NodeJS.Timeout);
      setIsPressed(false);
    }
  }, [disabled]);

  return (
    <button
      type="button"
      className={cn(
        // base
        'group inline-flex size-5 items-center truncate rounded transition',
        disabled
          ? 'cursor-not-allowed text-gray-400'
          : 'cursor-pointer text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      )}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        setIsPressed(true);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        setIsPressed(false);
      }}
    >
      <Icon className="size-full" aria-hidden="true" />
    </button>
  );
};

interface LegendProps extends React.OlHTMLAttributes<HTMLOListElement> {
  activeLegend?: string;
  categories: string[];
  colors?: AvailableChartColorsKeys[];
  enableLegendSlider?: boolean;
  onClickLegendItem?: (category: string, color: string) => void;
}

type HasScrollProps = {
  left: boolean;
  right: boolean;
};

const Legend = React.forwardRef<HTMLOListElement, LegendProps>((props, ref) => {
  const {
    categories,
    colors = AvailableChartColors,
    className,
    onClickLegendItem,
    activeLegend,
    enableLegendSlider = false,
    ...other
  } = props;
  const scrollableRef = React.useRef<HTMLInputElement>(null);
  const scrollButtonsRef = React.useRef<HTMLDivElement>(null);
  const [hasScroll, setHasScroll] = React.useState<HasScrollProps | null>(null);
  const [isKeyDowned, setIsKeyDowned] = React.useState<string | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const checkScroll = React.useCallback(() => {
    const scrollable = scrollableRef?.current;
    if (!scrollable) return;

    const hasLeftScroll = scrollable.scrollLeft > 0;
    const hasRightScroll =
      scrollable.scrollWidth - scrollable.clientWidth > scrollable.scrollLeft;

    setHasScroll({ left: hasLeftScroll, right: hasRightScroll });
  }, [setHasScroll]);

  const scrollToTest = React.useCallback(
    (direction: 'left' | 'right') => {
      const element = scrollableRef?.current;
      const scrollButtons = scrollButtonsRef?.current;
      const scrollButtonsWith = scrollButtons?.clientWidth ?? 0;
      const width = element?.clientWidth ?? 0;

      if (element && enableLegendSlider) {
        element.scrollTo({
          left:
            direction === 'left'
              ? element.scrollLeft - width + scrollButtonsWith
              : element.scrollLeft + width - scrollButtonsWith,
          behavior: 'smooth',
        });
        setTimeout(() => {
          checkScroll();
        }, 400);
      }
    },
    [enableLegendSlider, checkScroll]
  );

  React.useEffect(() => {
    const keyDownHandler = (key: string) => {
      if (key === 'ArrowLeft') {
        scrollToTest('left');
      } else if (key === 'ArrowRight') {
        scrollToTest('right');
      }
    };
    if (isKeyDowned) {
      keyDownHandler(isKeyDowned);
      intervalRef.current = setInterval(() => {
        keyDownHandler(isKeyDowned);
      }, 300);
    } else {
      clearInterval(intervalRef.current as NodeJS.Timeout);
    }
    return () => clearInterval(intervalRef.current as NodeJS.Timeout);
  }, [isKeyDowned, scrollToTest]);

  const keyDown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      setIsKeyDowned(e.key);
    }
  };
  const keyUp = (e: KeyboardEvent) => {
    e.stopPropagation();
    setIsKeyDowned(null);
  };

  React.useEffect(() => {
    const scrollable = scrollableRef?.current;
    if (enableLegendSlider) {
      checkScroll();
      scrollable?.addEventListener('keydown', keyDown);
      scrollable?.addEventListener('keyup', keyUp);
    }

    return () => {
      scrollable?.removeEventListener('keydown', keyDown);
      scrollable?.removeEventListener('keyup', keyUp);
    };
  }, [checkScroll, enableLegendSlider]);

  return (
    <ol
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      {...other}
    >
      <div
        ref={scrollableRef}
        tabIndex={0}
        className={cn(
          'flex h-full',
          enableLegendSlider
            ? hasScroll?.right || hasScroll?.left
              ? 'snap-mandatory items-center overflow-auto pl-4 pr-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              : ''
            : 'flex-wrap'
        )}
      >
        {categories.map((category, index) => (
          <LegendItem
            key={`item-${index}`}
            name={category}
            color={colors[index] as AvailableChartColorsKeys}
            onClick={onClickLegendItem}
            activeLegend={activeLegend}
          />
        ))}
      </div>
      {enableLegendSlider && (hasScroll?.right || hasScroll?.left) ? (
        <div
          className={cn(
            // base
            'absolute bottom-0 right-0 top-0 flex h-full items-center justify-center pr-1',
            // background color
            'bg-white '
          )}
        >
          <ScrollButton
            icon={ArrowLeft}
            onClick={() => {
              setIsKeyDowned(null);
              scrollToTest('left');
            }}
            disabled={!hasScroll?.left}
          />
          <ScrollButton
            icon={ArrowRight}
            onClick={() => {
              setIsKeyDowned(null);
              scrollToTest('right');
            }}
            disabled={!hasScroll?.right}
          />
        </div>
      ) : null}
    </ol>
  );
});

Legend.displayName = 'Legend';

const ChartLegend = (
  { payload }: any,
  categoryColors: Map<string, AvailableChartColorsKeys>,
  setLegendHeight: React.Dispatch<React.SetStateAction<number>>,
  activeLegend: string | undefined,
  onClick?: (category: string, color: string) => void,
  enableLegendSlider?: boolean,
  legendPosition?: 'left' | 'center' | 'right',
  yAxisWidth?: number
) => {
  const legendRef = React.useRef<HTMLDivElement>(null);

  useOnWindowResize(() => {
    const calculateHeight = (height: number | undefined) =>
      height ? Number(height) + 15 : 60;
    setLegendHeight(calculateHeight(legendRef.current?.clientHeight));
  });

  const filteredPayload = payload.filter((item: any) => item.type !== 'none');

  const paddingLeft =
    legendPosition === 'left' && yAxisWidth ? yAxisWidth - 8 : 0;

  return (
    <div
      ref={legendRef}
      style={{ paddingLeft }}
      className={cn(
        'flex items-center',
        { 'justify-center': legendPosition === 'center' },
        { 'justify-start': legendPosition === 'left' },
        { 'justify-end': legendPosition === 'right' }
      )}
    >
      <Legend
        categories={filteredPayload.map((entry: any) => entry.value)}
        colors={filteredPayload.map((entry: any) =>
          categoryColors.get(entry.value)
        )}
        onClickLegendItem={onClick}
        activeLegend={activeLegend}
        enableLegendSlider={enableLegendSlider}
      />
    </div>
  );
};

// #region Tooltip

interface ChartTooltipRowProps {
  color: string;
  name: string;
  value: string;
}

const ChartTooltipRow = ({ value, name, color }: ChartTooltipRowProps) => (
  <div className="flex items-center justify-between space-x-8">
    <div className="flex items-center space-x-2">
      <span
        aria-hidden="true"
        className={cn('h-[3px] w-3.5 shrink-0 rounded-full', color)}
      />
      <p
        className={cn(
          // commmon
          'whitespace-nowrap text-right',
          // text color
          'text-gray-700'
        )}
      >
        {name}
      </p>
    </div>
    <p
      className={cn(
        // base
        'whitespace-nowrap text-right font-medium tabular-nums',
        // text color
        'text-gray-900'
      )}
    >
      {value}
    </p>
  </div>
);

type TooltipCallbackProps = Pick<
  ChartTooltipProps,
  'active' | 'payload' | 'label'
>;

interface ChartTooltipProps {
  active: boolean | undefined;
  categoryColors: Map<string, string>;
  label: string;
  payload: any;
  valueFormatter: (value: number) => string;
}

const ChartTooltip = ({
  active,
  payload,
  label,
  categoryColors,
  valueFormatter,
}: ChartTooltipProps) => {
  if (active && payload) {
    const filteredPayload = payload.filter((item: any) => item.type !== 'none');

    return (
      <div
        className={cn(
          // base
          'rounded-md border text-sm shadow-md',
          // border color
          'border-gray-200',
          // background color
          'bg-white'
        )}
      >
        <div
          className={cn(
            // base
            'border-b border-inherit px-4 py-2'
          )}
        >
          <p
            className={cn(
              // base
              'font-medium',
              // text color
              'text-gray-900 '
            )}
          >
            {label}
          </p>
        </div>

        <div className={cn('space-y-1 px-4 py-2')}>
          {filteredPayload.map(
            (
              { value, name }: { name: string; value: number },
              index: number
            ) => (
              <ChartTooltipRow
                key={`id-${index}`}
                value={valueFormatter(value)}
                name={name}
                color={getColorClassName(
                  categoryColors.get(name) as AvailableChartColorsKeys,
                  'bg'
                )}
              />
            )
          )}
        </div>
      </div>
    );
  }
  return null;
};

// #region AreaChart

interface ActiveDot {
  dataKey?: string;
  index?: number;
}

type BaseEventProps = {
  [key: string]: number | string;
  categoryClicked: string;
  eventType: 'dot' | 'category';
};

type AreaChartEventProps = BaseEventProps | null | undefined;

interface AreaChartProps extends React.HTMLAttributes<HTMLDivElement> {
  allowDecimals?: boolean;
  autoMinValue?: boolean;
  categories: string[];
  colors?: AvailableChartColorsKeys[];
  connectNulls?: boolean;
  data: Record<string, any>[];
  enableLegendSlider?: boolean;
  fill?: 'gradient' | 'solid' | 'none';
  index: string;
  intervalType?: 'preserveStartEnd' | 'equidistantPreserveStart';
  legendPosition?: 'left' | 'center' | 'right';
  maxValue?: number;
  minValue?: number;
  onValueChange?: (value: AreaChartEventProps) => void;
  showGridLines?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  startEndOnly?: boolean;
  tickGap?: number;
  tooltipCallback?: (tooltipCallbackContent: TooltipCallbackProps) => void;
  type?: 'default' | 'stacked' | 'percent';
  valueFormatter?: (value: number) => string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisWidth?: number;
}

const AreaChart = React.forwardRef<HTMLDivElement, AreaChartProps>(
  (props, ref) => {
    const {
      data = [],
      categories = [],
      index,
      colors = AvailableChartColors,
      valueFormatter = (value: number) => value.toString(),
      startEndOnly = false,
      showXAxis = true,
      showYAxis = true,
      showGridLines = true,
      yAxisWidth = 56,
      intervalType = 'equidistantPreserveStart',
      showTooltip = true,
      showLegend = true,
      autoMinValue = false,
      minValue,
      maxValue,
      allowDecimals = true,
      connectNulls = false,
      className,
      onValueChange,
      enableLegendSlider = false,
      tickGap = 5,
      xAxisLabel,
      yAxisLabel,
      type = 'default',
      legendPosition = 'right',
      tooltipCallback,
      fill = 'gradient',
      ...other
    } = props;
    const paddingValue = !showXAxis && !showYAxis ? 0 : 20;
    const [legendHeight, setLegendHeight] = React.useState(60);
    const [activeDot, setActiveDot] = React.useState<ActiveDot | undefined>(
      undefined
    );
    const [activeLegend, setActiveLegend] = React.useState<string | undefined>(
      undefined
    );
    const categoryColors = constructCategoryColors(categories, colors);

    const yAxisDomain = getYAxisDomain(autoMinValue, minValue, maxValue);
    const hasOnValueChange = !!onValueChange;
    const stacked = type === 'stacked' || type === 'percent';
    const areaId = React.useId();

    const getFillContent = ({
      fillType,
      activeDot,
      activeLegend,
      category,
    }: {
      activeDot: ActiveDot | undefined;
      activeLegend: string | undefined;
      category: string;
      fillType: AreaChartProps['fill'];
    }) => {
      const stopOpacity =
        activeDot || (activeLegend && activeLegend !== category) ? 0.15 : 0.4;

      switch (fillType) {
        case 'none':
          return <stop stopColor="currentColor" stopOpacity={0} />;
        case 'gradient':
          return (
            <>
              <stop
                offset="5%"
                stopColor="currentColor"
                stopOpacity={stopOpacity}
              />
              <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
            </>
          );
        case 'solid':
        default:
          return <stop stopColor="currentColor" stopOpacity={stopOpacity} />;
      }
    };

    const valueToPercent = (value: number) => `${(value * 100).toFixed(0)}%`;

    function onDotClick(itemData: any, event: React.MouseEvent) {
      event.stopPropagation();

      if (!hasOnValueChange) return;
      if (
        (itemData.index === activeDot?.index &&
          itemData.dataKey === activeDot?.dataKey) ||
        (hasOnlyOneValueForKey(data, itemData.dataKey) &&
          activeLegend &&
          activeLegend === itemData.dataKey)
      ) {
        setActiveLegend(undefined);
        setActiveDot(undefined);
        onValueChange?.(null);
      } else {
        setActiveLegend(itemData.dataKey);
        setActiveDot({
          index: itemData.index,
          dataKey: itemData.dataKey,
        });
        onValueChange?.({
          eventType: 'dot',
          categoryClicked: itemData.dataKey,
          ...itemData.payload,
        });
      }
    }

    function onCategoryClick(dataKey: string) {
      if (!hasOnValueChange) return;
      if (
        (dataKey === activeLegend && !activeDot) ||
        (hasOnlyOneValueForKey(data, dataKey) &&
          activeDot &&
          activeDot.dataKey === dataKey)
      ) {
        setActiveLegend(undefined);
        onValueChange?.(null);
      } else {
        setActiveLegend(dataKey);
        onValueChange?.({
          eventType: 'category',
          categoryClicked: dataKey,
        });
      }
      setActiveDot(undefined);
    }

    return (
      <div ref={ref} className={cn('h-80 w-full', className)} {...other}>
        <ResponsiveContainer>
          <RechartsAreaChart
            data={data}
            onClick={
              hasOnValueChange && (activeLegend || activeDot)
                ? () => {
                    setActiveDot(undefined);
                    setActiveLegend(undefined);
                    onValueChange?.(null);
                  }
                : undefined
            }
            margin={{
              bottom: xAxisLabel ? 30 : undefined,
              left: yAxisLabel ? 20 : undefined,
              right: yAxisLabel ? 5 : undefined,
              top: 5,
            }}
            stackOffset={type === 'percent' ? 'expand' : undefined}
          >
            {showGridLines ? (
              <CartesianGrid
                className={cn('stroke-gray-200 stroke-1 ')}
                horizontal
                vertical={false}
              />
            ) : null}
            <XAxis
              padding={{ left: paddingValue, right: paddingValue }}
              hide={!showXAxis}
              dataKey={index}
              interval={startEndOnly ? 'preserveStartEnd' : intervalType}
              tick={{ transform: 'translate(0, 6)' }}
              ticks={
                startEndOnly
                  ? [data[0][index], data[data.length - 1][index]]
                  : undefined
              }
              fill=""
              stroke=""
              className={cn(
                // base
                'text-xs',
                // text fill
                'fill-gray-500'
              )}
              tickLine={false}
              axisLine={false}
              minTickGap={tickGap}
            >
              {xAxisLabel && (
                <Label
                  position="insideBottom"
                  offset={-20}
                  className="fill-gray-800 text-sm font-medium"
                >
                  {xAxisLabel}
                </Label>
              )}
            </XAxis>
            <YAxis
              width={yAxisWidth}
              hide={!showYAxis}
              axisLine={false}
              tickLine={false}
              type="number"
              domain={yAxisDomain as AxisDomain}
              tick={{ transform: 'translate(-3, 0)' }}
              fill=""
              stroke=""
              className={cn(
                // base
                'text-xs',
                // text fill
                'fill-gray-500'
              )}
              tickFormatter={
                type === 'percent' ? valueToPercent : valueFormatter
              }
              allowDecimals={allowDecimals}
            >
              {yAxisLabel && (
                <Label
                  position="insideLeft"
                  style={{ textAnchor: 'middle' }}
                  angle={-90}
                  offset={-15}
                  className="fill-gray-800 text-sm font-medium"
                >
                  {yAxisLabel}
                </Label>
              )}
            </YAxis>
            <Tooltip
              wrapperStyle={{ outline: 'none' }}
              isAnimationActive
              animationDuration={100}
              cursor={{ stroke: '#d1d5db', strokeWidth: 1 }}
              offset={20}
              position={{ y: 0 }}
              content={({ active, payload, label }: any) => {
                React.useEffect(() => {
                  if (tooltipCallback && payload) {
                    const filteredPayload = payload.map((item: any) => ({
                      category: item.dataKey,
                      value: item.value,
                      index: item.payload.date,
                      color: categoryColors.get(
                        item.dataKey
                      ) as AvailableChartColorsKeys,
                      payload: item.payload,
                    }));
                    tooltipCallback({
                      active,
                      payload: filteredPayload,
                      label,
                    });
                  }
                }, [label, active]);

                return showTooltip && active ? (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    valueFormatter={valueFormatter}
                    categoryColors={categoryColors}
                  />
                ) : null;
              }}
            />
            {showLegend ? (
              <RechartsLegend
                verticalAlign="top"
                height={legendHeight}
                content={({ payload }: any) =>
                  ChartLegend(
                    { payload },
                    categoryColors,
                    setLegendHeight,
                    activeLegend,
                    hasOnValueChange
                      ? (clickedLegendItem: string) =>
                          onCategoryClick(clickedLegendItem)
                      : undefined,
                    enableLegendSlider,
                    legendPosition,
                    yAxisWidth
                  )
                }
              />
            ) : null}
            {categories.map((category) => {
              const categoryId = `${areaId}-${category.replace(/[^a-zA-Z0-9]/g, '')}`;
              return (
                <React.Fragment key={category}>
                  <defs key={category}>
                    <linearGradient
                      key={category}
                      className={cn(
                        getColorClassName(
                          categoryColors.get(
                            category
                          ) as AvailableChartColorsKeys,
                          'text'
                        )
                      )}
                      id={categoryId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      {getFillContent({
                        fillType: fill,
                        activeDot,
                        activeLegend,
                        category,
                      })}
                    </linearGradient>
                  </defs>
                  <Area
                    className={cn(
                      getColorClassName(
                        categoryColors.get(
                          category
                        ) as AvailableChartColorsKeys,
                        'stroke'
                      )
                    )}
                    strokeOpacity={
                      activeDot || (activeLegend && activeLegend !== category)
                        ? 0.3
                        : 1
                    }
                    activeDot={(props: any) => {
                      const {
                        cx: cxCoord,
                        cy: cyCoord,
                        stroke,
                        strokeLinecap,
                        strokeLinejoin,
                        strokeWidth,
                        dataKey,
                      } = props;
                      return (
                        <Dot
                          className={cn(
                            'stroke-white',
                            onValueChange ? 'cursor-pointer' : '',
                            getColorClassName(
                              categoryColors.get(
                                dataKey
                              ) as AvailableChartColorsKeys,
                              'fill'
                            )
                          )}
                          cx={cxCoord}
                          cy={cyCoord}
                          r={5}
                          fill=""
                          stroke={stroke}
                          strokeLinecap={strokeLinecap}
                          strokeLinejoin={strokeLinejoin}
                          strokeWidth={strokeWidth}
                          onClick={(_: any, event: any) =>
                            onDotClick(props, event)
                          }
                        />
                      );
                    }}
                    dot={(props: any) => {
                      const {
                        stroke,
                        strokeLinecap,
                        strokeLinejoin,
                        strokeWidth,
                        cx: cxCoord,
                        cy: cyCoord,
                        dataKey,
                        index,
                      } = props;

                      if (
                        (hasOnlyOneValueForKey(data, category) &&
                          !(
                            activeDot ||
                            (activeLegend && activeLegend !== category)
                          )) ||
                        (activeDot?.index === index &&
                          activeDot?.dataKey === category)
                      ) {
                        return (
                          <Dot
                            key={index}
                            cx={cxCoord}
                            cy={cyCoord}
                            r={5}
                            stroke={stroke}
                            fill=""
                            strokeLinecap={strokeLinecap}
                            strokeLinejoin={strokeLinejoin}
                            strokeWidth={strokeWidth}
                            className={cn(
                              'stroke-white',
                              onValueChange ? 'cursor-pointer' : '',
                              getColorClassName(
                                categoryColors.get(
                                  dataKey
                                ) as AvailableChartColorsKeys,
                                'fill'
                              )
                            )}
                          />
                        );
                      }
                      return <React.Fragment key={index} />;
                    }}
                    key={category}
                    name={category}
                    type="linear"
                    dataKey={category}
                    stroke=""
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    isAnimationActive={false}
                    connectNulls={connectNulls}
                    stackId={stacked ? 'stack' : undefined}
                    fill={`url(#${categoryId})`}
                  />
                </React.Fragment>
              );
            })}
            {/* hidden lines to increase clickable target area */}
            {onValueChange
              ? categories.map((category) => (
                  <Line
                    className={cn('cursor-pointer')}
                    strokeOpacity={0}
                    key={category}
                    name={category}
                    type="linear"
                    dataKey={category}
                    stroke="transparent"
                    fill="transparent"
                    legendType="none"
                    tooltipType="none"
                    strokeWidth={12}
                    connectNulls={connectNulls}
                    onClick={(props: any, event: any) => {
                      event.stopPropagation();
                      const { name } = props;
                      onCategoryClick(name);
                    }}
                  />
                ))
              : null}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

AreaChart.displayName = 'AreaChart';

export { AreaChart, type AreaChartEventProps, type TooltipCallbackProps };
