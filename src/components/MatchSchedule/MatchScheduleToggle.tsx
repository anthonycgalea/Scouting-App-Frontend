import { SegmentedControl } from '@mantine/core';
import classes from './MatchScheduleToggle.module.css';

export type MatchScheduleSection = 'qualification' | 'playoffs' | 'finals';

export interface MatchScheduleToggleOption {
  label: string;
  value: MatchScheduleSection;
}

interface MatchScheduleToggleProps {
  value: MatchScheduleSection;
  options: MatchScheduleToggleOption[];
  onChange: (value: MatchScheduleSection) => void;
}

export function MatchScheduleToggle({ value, options, onChange }: MatchScheduleToggleProps) {
  return (
    <SegmentedControl
      radius="xl"
      size="md"
      value={value}
      data={options}
      onChange={(newValue) => onChange(newValue as MatchScheduleSection)}
      classNames={classes}
    />
  );
}
