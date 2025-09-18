import { SegmentedControl } from '@mantine/core';
import classes from './TeamPageToggle.module.css';

export function TeamPageToggle() {
  return (
    <SegmentedControl
      radius="xl"
      size="md"
      data={['Match Data', 'Analytics', 'Pit Scouting']}
      classNames={classes}
    />
  );
}