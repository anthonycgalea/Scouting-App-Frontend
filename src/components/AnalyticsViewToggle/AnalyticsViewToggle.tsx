import { SegmentedControl } from '@mantine/core';

import classes from './AnalyticsViewToggle.module.css';

export type AnalyticsView = 'scatter' | 'bar';

type AnalyticsViewToggleProps = {
  value: AnalyticsView;
  onChange: (value: AnalyticsView) => void;
};

export function AnalyticsViewToggle({ value, onChange }: AnalyticsViewToggleProps) {
  return (
    <SegmentedControl
      radius="xl"
      size="md"
      data={[
        { label: 'Auto + Endgame vs Teleop', value: 'scatter' },
        { label: 'Team Averages', value: 'bar' },
      ]}
      value={value}
      onChange={(newValue) => onChange(newValue as AnalyticsView)}
      classNames={classes}
    />
  );
}
