import { Card, Group, Slider, Stack, Text } from '@mantine/core';
import { useMemo } from 'react';

import classes from './WeightSlider.module.css';

interface WeightSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function WeightSlider({ label, value, onChange }: WeightSliderProps) {
  const sliderValue = useMemo(() => Math.round(value * 100), [value]);

  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Text fw={600} size="sm">
            {label}
          </Text>
          <Text fw={600} size="sm">
            {sliderValue}
          </Text>
        </Group>
        <Slider
          min={0}
          max={100}
          step={1}
          value={sliderValue}
          label={(current) => `${current}`}
          classNames={classes}
          onChange={(nextValue) => {
            onChange(nextValue / 100);
          }}
        />
        <Text size="xs" c="dimmed">
          Set the weight to 0 to remove it from the configured list.
        </Text>
      </Stack>
    </Card>
  );
}
