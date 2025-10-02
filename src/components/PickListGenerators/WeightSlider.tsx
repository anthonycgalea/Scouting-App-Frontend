import { Slider, Stack, Text } from '@mantine/core';
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
    <Stack gap={4}>
      <Text fw={600} size="sm">
        {label}
      </Text>
      <Slider
        min={0}
        max={100}
        step={1}
        value={sliderValue}
        label={(current) => `${current}`}
        labelAlwaysOn
        classNames={classes}
        onChange={(nextValue) => {
          onChange(nextValue / 100);
        }}
      />
    </Stack>
  );
}
