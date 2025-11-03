import { type CSSProperties, useEffect, useMemo, useState } from 'react';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ActionIcon,
  Button,
  Group,
  Popover,
  Stack,
  Text,
  Textarea,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowNarrowDown,
  IconArrowNarrowUp,
  IconExternalLink,
  IconNote,
  IconSquareCheckFilled,
  IconSquareXFilled,
  IconX,
} from '@tabler/icons-react';
import clsx from 'clsx';

import type { PickListRank } from '@/api/pickLists';
import type { EventTeam } from '@/api/teams';

import { TeamCommonCommentsTooltip } from '@/components/SuperScout/TeamCommonComments';

import classes from './PickListTeamsList.module.css';

interface PickListTeamsListProps {
  ranks: PickListRank[];
  eventTeamsByNumber: Map<number, EventTeam>;
  rankChangeIndicators?: Map<number, RankChangeIndicator>;
  onReorder: (nextRanks: PickListRank[]) => void;
  onRemoveTeam: (teamNumber: number) => void;
  onUpdateNotes: (teamNumber: number, notes: string) => void;
  onToggleDnp: (teamNumber: number) => void;
}

interface SortableTeamCardProps {
  rank: PickListRank;
  teamDetails: EventTeam | undefined;
  rankChangeIndicator?: RankChangeIndicator;
  onRemove: (teamNumber: number) => void;
  onSaveNotes: (teamNumber: number, notes: string) => void;
  onToggleDnp: (teamNumber: number) => void;
}

export type RankChangeIndicator =
  | { type: 'none' }
  | { type: 'new' }
  | { type: 'movedUp'; spots: number }
  | { type: 'movedDown'; spots: number };

function SortableTeamCard({
  rank,
  teamDetails,
  rankChangeIndicator,
  onRemove,
  onSaveNotes,
  onToggleDnp,
}: SortableTeamCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rank.team_number.toString(),
  });

  const [isPopoverOpen, { close, toggle, open }] = useDisclosure(false);
  const [draftNotes, setDraftNotes] = useState(rank.notes ?? '');

  useEffect(() => {
    if (!isPopoverOpen) {
      setDraftNotes(rank.notes ?? '');
    }
  }, [rank.notes, isPopoverOpen]);

  const cardStyles: CSSProperties = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition],
  );

  const hasNotes = (rank.notes ?? '').trim().length > 0;
  const isDnp = rank.dnp;

  return (
    <div
      ref={setNodeRef}
      style={cardStyles}
      className={clsx(classes.item, { [classes.itemDragging]: isDragging })}
      {...attributes}
      {...listeners}
    >
      <div className={classes.teamInfo}>
        <div className={classes.rankAndNumber}>
          {!isDnp && <Text className={classes.rankValue}>{rank.rank}</Text>}
          <Text className={classes.teamNumber}>{rank.team_number}</Text>
        </div>
        <div className={classes.teamDetails}>
          <Text className={classes.teamName} title={teamDetails?.team_name ?? 'Team information unavailable'}>
            {teamDetails?.team_name ?? 'Team information unavailable'}
          </Text>
          {rankChangeIndicator && rankChangeIndicator.type !== 'none' && (
            <Group gap={4} className={classes.rankChangeIndicator} wrap="nowrap">
              {rankChangeIndicator.type === 'new' ? (
                <Text fw={600} size="xs" c="blue">
                  NEW
                </Text>
              ) : rankChangeIndicator.type === 'movedUp' ? (
                <>
                  <IconArrowNarrowUp size={16} stroke={2.25} color="var(--mantine-color-green-6)" />
                  <Text fw={600} size="xs" c="green">
                    {rankChangeIndicator.spots}
                  </Text>
                </>
              ) : (
                <>
                  <IconArrowNarrowDown size={16} stroke={2.25} color="var(--mantine-color-red-6)" />
                  <Text fw={600} size="xs" c="red">
                    {rankChangeIndicator.spots}
                  </Text>
                </>
              )}
            </Group>
          )}
        </div>
      </div>

      <div className={classes.actions}>
        <Tooltip label={`Open team ${rank.team_number} page`} withArrow>
          <ActionIcon
            component="a"
            href={`/teams/${rank.team_number}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open team ${rank.team_number} page`}
            variant="subtle"
            color="blue"
          >
            <IconExternalLink size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip
          label={
            isDnp
              ? `Remove ${rank.team_number} from DNP`
              : "DNP"
          }
          withArrow
        >
          <ActionIcon
            aria-label={
              isDnp
                ? `Remove ${rank.team_number} from DNP`
                : `DNP ${rank.team_number}`
            }
            variant="subtle"
            color={isDnp ? 'green' : 'orange'}
            onClick={() => onToggleDnp(rank.team_number)}
          >
            {isDnp ? <IconSquareCheckFilled size={18} /> : <IconSquareXFilled size={18} />}
          </ActionIcon>
        </Tooltip>

        <Popover
          opened={isPopoverOpen}
          onChange={(opened) => (opened ? open() : close())}
          withArrow
          shadow="md"
        >
          <Popover.Target>
            <Tooltip label={hasNotes ? 'Edit Notes' : 'Add Notes'} withArrow>
              <ActionIcon
                aria-label={hasNotes ? 'Edit Notes' : 'Add Notes'}
                variant="subtle"
                color={hasNotes ? 'green' : 'gray'}
                onClick={toggle}
              >
                <IconNote size={18} />
              </ActionIcon>
            </Tooltip>
          </Popover.Target>
          <Popover.Dropdown maw={260}>
            <Stack gap="sm">
              <Textarea
                label="Pick list note"
                minRows={2}
                autosize
                value={draftNotes}
                onChange={(event) => setDraftNotes(event.currentTarget.value)}
                onKeyDownCapture={(event) => {
                  event.stopPropagation();
                  event.nativeEvent.stopImmediatePropagation?.();
                }}
              />
              <Group justify="flex-end" gap="xs">
                <Button variant="default" size="xs" onClick={close}>
                  Cancel
                </Button>
                <Button
                  size="xs"
                  onClick={() => {
                    onSaveNotes(rank.team_number, draftNotes);
                    close();
                  }}
                >
                  Save Changes
                </Button>
              </Group>
            </Stack>
          </Popover.Dropdown>
        </Popover>

        <TeamCommonCommentsTooltip teamNumber={rank.team_number} />

        <Tooltip label="Remove" withArrow>
          <ActionIcon
            aria-label="Remove"
            color="red"
            variant="subtle"
            onClick={() => onRemove(rank.team_number)}
          >
            <IconX size={18} />
          </ActionIcon>
        </Tooltip>
      </div>
    </div>
  );
}

export function PickListTeamsList({
  ranks,
  eventTeamsByNumber,
  rankChangeIndicators,
  onReorder,
  onRemoveTeam,
  onUpdateNotes,
  onToggleDnp,
}: PickListTeamsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: ['Enter'],
        cancel: ['Escape'],
        end: ['Enter', 'Space'],
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = ranks.findIndex((rank) => rank.team_number.toString() === active.id);
    const newIndex = ranks.findIndex((rank) => rank.team_number.toString() === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    onReorder(arrayMove(ranks, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={ranks.map((rank) => rank.team_number.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className={classes.list}>
          {ranks.map((rank) => (
        <SortableTeamCard
          key={rank.team_number}
          rank={rank}
          teamDetails={eventTeamsByNumber.get(rank.team_number)}
          rankChangeIndicator={rankChangeIndicators?.get(rank.team_number)}
          onRemove={onRemoveTeam}
          onSaveNotes={onUpdateNotes}
          onToggleDnp={onToggleDnp}
        />
      ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
