import { Stack, Text, Tooltip } from '@mantine/core';
import { IconInfoCircle, IconStarFilled } from '@tabler/icons-react';
import cx from 'clsx';

import type { PickListGenerator } from '@/api/pickLists';

import classes from './PickListGeneratorSelector.module.css';

interface PickListGeneratorSelectorProps {
  generators: PickListGenerator[];
  selectedGeneratorId: string | null;
  onSelectGenerator: (generatorId: string) => void;
}

const formatDateTime = (isoDate: string) =>
  new Date(isoDate).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export function PickListGeneratorSelector({
  generators,
  selectedGeneratorId,
  onSelectGenerator,
}: PickListGeneratorSelectorProps) {
  return (
    <Stack gap="sm">
      {generators.map((generator) => {
        const isActive = generator.id === selectedGeneratorId;

        return (
          <button
            type="button"
            key={generator.id}
            className={cx(classes.card, { [classes.cardActive]: isActive })}
            onClick={() => onSelectGenerator(generator.id)}
          >
            <div className={classes.content}>
              <div className={classes.header}>
                {generator.favorited && (
                  <span className={classes.favoriteIcon} aria-hidden="true">
                    <IconStarFilled size={18} stroke={1.5} />
                  </span>
                )}
                <Text fw={600}>{generator.title}</Text>
              </div>
              <Text c="dimmed" size="sm">
                Last updated {formatDateTime(generator.timestamp)}
              </Text>
            </div>
            {generator.notes && (
              <Tooltip label={generator.notes} multiline maw={240} withinPortal>
                <span className={classes.infoIcon} aria-label="Generator notes">
                  <IconInfoCircle size={20} stroke={1.5} />
                </span>
              </Tooltip>
            )}
          </button>
        );
      })}
    </Stack>
  );
}
