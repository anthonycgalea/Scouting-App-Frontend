import { Stack, Text, Tooltip } from '@mantine/core';
import { IconInfoCircle, IconStar, IconStarFilled } from '@tabler/icons-react';
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
            <div className={classes.content}>
              <div className={classes.header}>
                <span className={classes.favoriteIcon} aria-hidden="true">
                  {pickList.favorited ? (
                    <IconStarFilled size={18} stroke={1.5} />
                  ) : (
                    <IconStar size={18} stroke={1.5} />
                  )}
                </span>
                <Text fw={600}>{pickList.title}</Text>
              </div>
              <Text c="dimmed" size="sm">
                Last updated {formatDateTime(pickList.last_updated)}
              </Text>
            </div>
            {pickList.notes && (
              <Tooltip label={pickList.notes} multiline maw={240} withinPortal>
                <span className={classes.infoIcon} aria-label="Pick list notes">
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
