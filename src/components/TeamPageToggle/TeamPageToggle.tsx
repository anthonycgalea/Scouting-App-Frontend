import { SegmentedControl } from '@mantine/core';
import classes from './TeamPageToggle.module.css';

export type TeamPageSection = 'match-data' | 'analytics' | 'pit-scouting';

type TeamPageToggleProps = {
  value: TeamPageSection;
  onChange: (value: TeamPageSection) => void;
};

export function TeamPageToggle({ value, onChange }: TeamPageToggleProps) {
  return (
    <SegmentedControl
      radius="xl"
      size="md"
      data={[
        { label: 'Match Data', value: 'match-data' },
        { label: 'Analytics', value: 'analytics' },
        { label: 'Pit Scouting', value: 'pit-scouting' },
      ]}
      value={value}
      onChange={(newValue) => onChange(newValue as TeamPageSection)}
      classNames={classes}
    />
  );
}