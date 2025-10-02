import {
  ActionIcon,
  Card,
  Group,
  NumberInput,
  Slider,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
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
            <NumberInput
              value={sliderValue}
              min={0}
              max={100}
              step={1}
              clampBehavior="strict"
              allowDecimal={false}
              size="xs"
              aria-label={`Set ${label} weight`}
              w={74}
              onChange={(nextValue) => {
                if (nextValue === '') {
                  return;
                }

                const parsedValue =
                  typeof nextValue === 'number'
                    ? nextValue
                    : Number.parseInt(nextValue, 10);

                if (Number.isNaN(parsedValue)) {
                  return;
                }

                const clampedValue = Math.min(100, Math.max(0, Math.round(parsedValue)));

                onChange(clampedValue / 100);
              }}
            />
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
