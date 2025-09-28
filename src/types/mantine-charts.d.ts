declare module '@mantine/charts' {
  import type { ReactNode } from 'react';

  export type ScatterChartPoint = Record<string, unknown>;

  export type ScatterChartSeries<Point extends ScatterChartPoint = ScatterChartPoint> = {
    name?: string;
    color?: string;
    data: Point[];
  };

  export type ScatterChartDataKey = {
    x: string;
    y: string;
  };

  export type ScatterChartTooltipPayload<Point extends ScatterChartPoint = ScatterChartPoint> = {
    payload: Point;
  };

  export type ScatterChartTooltipProps<Point extends ScatterChartPoint = ScatterChartPoint> = {
    formatter?: (
      value: unknown,
      name: string,
      entry: ScatterChartTooltipPayload<Point>,
      index: number
    ) => [ReactNode, ReactNode] | ReactNode;
    labelFormatter?: (
      label: unknown,
      payload: ScatterChartTooltipPayload<Point>[]
    ) => ReactNode;
  };

  export type ScatterChartProps<Point extends ScatterChartPoint = ScatterChartPoint> = {
    h?: number;
    data: ScatterChartSeries<Point>[];
    dataKey: ScatterChartDataKey;
    xAxisLabel?: string;
    yAxisLabel?: string;
    pointLabels?: string | string[];
    tooltipProps?: ScatterChartTooltipProps<Point>;
  };

  export const ScatterChart: <Point extends ScatterChartPoint = ScatterChartPoint>(
    props: ScatterChartProps<Point>
  ) => JSX.Element;
}
