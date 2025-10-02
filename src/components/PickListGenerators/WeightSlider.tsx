import { ActionIcon, Card, Group, Slider, Stack, Text, Tooltip } from '@mantine/core';
import { useMemo } from 'react';
import { IconTrash } from '@tabler/icons-react';

import classes from './WeightSlider.module.css';

interface WeightSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onRemove: () => void;
}

export function WeightSlider({ label, value, onChange, onRemove }: WeightSliderProps) {
  const sliderValue = useMemo(() => Math.round(value * 100), [value]);

  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Text fw={600} size="sm">
            {label}
          </Text>
          <Group gap="xs" align="center">
            <Text fw={600} size="sm">
              {sliderValue}
            </Text>
            <Tooltip label="Remove weight" withArrow>
              <ActionIcon
                aria-label={`Remove ${label} weight`}
                color="red"
                variant="subtle"
                onClick={onRemove}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
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
          Use the trash icon to remove this weight from the configured list.
        </Text>
      </Stack>
    </Card>
  );
}
