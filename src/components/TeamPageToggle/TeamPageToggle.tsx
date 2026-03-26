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
  showPitScouting?: boolean;
  showPrescoutMatchData?: boolean;
};

export function TeamPageToggle({
  value,
  onChange,
  showPitScouting = true,
  showPrescoutMatchData = true,
}: TeamPageToggleProps) {
  const tabData = [
    { label: 'Match Data', value: 'match-data' },
    { label: 'SuperScout', value: 'super-scout' },
    { label: 'Analytics', value: 'analytics' },
    ...(showPitScouting ? [{ label: 'Pit Scouting', value: 'pit-scouting' }] : []),
    ...(showPrescoutMatchData
      ? [{ label: 'Prescout Match Data', value: 'prescout-match-data' }]
      : []),
  ];

  return (
    <SegmentedControl
      radius="xl"
      size="md"
      data={tabData}
      value={value}
      onChange={(newValue) => onChange(newValue as TeamPageSection)}
      classNames={classes}
    />
  );
}
