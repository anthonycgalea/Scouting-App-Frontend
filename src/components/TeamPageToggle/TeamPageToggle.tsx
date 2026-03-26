import { SegmentedControl } from '@mantine/core';
import classes from './TeamPageToggle.module.css';

export type TeamPageSection =
  | 'match-data'
  | 'super-scout'
  | 'analytics'
  | 'pit-scouting'
  | 'prescout-match-data';

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
        { label: 'SuperScout', value: 'super-scout' },
        { label: 'Analytics', value: 'analytics' },
        { label: 'Pit Scouting', value: 'pit-scouting' },
        { label: 'Prescout Match Data', value: 'prescout-match-data' },
      ]}
      value={value}
      onChange={(newValue) => onChange(newValue as TeamPageSection)}
      classNames={classes}
    />
  );
}
