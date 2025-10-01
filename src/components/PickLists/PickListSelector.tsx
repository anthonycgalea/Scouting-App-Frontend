import { Stack, Text } from '@mantine/core';
import cx from 'clsx';

import type { PickList } from '@/api/pickLists';

import classes from './PickListSelector.module.css';

interface PickListSelectorProps {
  pickLists: PickList[];
  selectedPickListId: string | null;
  onSelectPickList: (pickListId: string) => void;
}

const formatDateTime = (isoDate: string) =>
  new Date(isoDate).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export function PickListSelector({
  pickLists,
  selectedPickListId,
  onSelectPickList,
}: PickListSelectorProps) {
  return (
    <Stack gap="sm">
      {pickLists.map((pickList) => {
        const isActive = pickList.id === selectedPickListId;

        return (
          <button
            type="button"
            key={pickList.id}
            className={cx(classes.card, { [classes.cardActive]: isActive })}
            onClick={() => onSelectPickList(pickList.id)}
          >
            <div className={classes.symbol}>
              <Text fw={700} size="lg">
                {pickList.title.slice(0, 2).toUpperCase()}
              </Text>
            </div>
            <div className={classes.content}>
              <Text fw={600}>{pickList.title}</Text>
              <Text c="dimmed" size="sm">
                Last updated {formatDateTime(pickList.last_updated)}
              </Text>
              {pickList.notes ? (
                <Text size="sm" className={classes.notes}>
                  {pickList.notes}
                </Text>
              ) : (
                <Text c="dimmed" size="sm">
                  No notes yet.
                </Text>
              )}
            </div>
          </button>
        );
      })}
    </Stack>
  );
}
