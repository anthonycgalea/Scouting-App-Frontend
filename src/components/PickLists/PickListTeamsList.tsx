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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActionIcon, Button, Group, Popover, Stack, Text, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconNote, IconX } from '@tabler/icons-react';
import clsx from 'clsx';

import type { PickListRank } from '@/api/pickLists';
import type { EventTeam } from '@/api/teams';

import classes from './PickListTeamsList.module.css';

interface PickListTeamsListProps {
  ranks: PickListRank[];
  eventTeamsByNumber: Map<number, EventTeam>;
  onReorder: (nextRanks: PickListRank[]) => void;
  onRemoveTeam: (teamNumber: number) => void;
  onUpdateNotes: (teamNumber: number, notes: string) => void;
}

interface SortableTeamCardProps {
  rank: PickListRank;
  displayRank: number;
  teamDetails: EventTeam | undefined;
  onRemove: (teamNumber: number) => void;
  onSaveNotes: (teamNumber: number, notes: string) => void;
}

function SortableTeamCard({ rank, displayRank, teamDetails, onRemove, onSaveNotes }: SortableTeamCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={cardStyles}
      className={clsx(classes.item, { [classes.itemDragging]: isDragging })}
      {...attributes}
      {...listeners}
    >
      <div className={classes.teamInfo}>
        <Text className={classes.teamNumber}>{rank.team_number}</Text>
        <div className={classes.teamDetails}>
          <Text className={classes.teamName} title={teamDetails?.team_name ?? 'Team information unavailable'}>
            {teamDetails?.team_name ?? 'Team information unavailable'}
          </Text>
          <Text className={classes.rankLabel}>Pick List Rank: {displayRank}</Text>
        </div>
      </div>

      <div className={classes.actions}>
        <Popover
          opened={isPopoverOpen}
          onChange={(opened) => (opened ? open() : close())}
          withArrow
          shadow="md"
        >
          <Popover.Target>
            <ActionIcon
              aria-label={hasNotes ? 'Edit pick list notes' : 'Add pick list notes'}
              variant="subtle"
              color={hasNotes ? 'green' : 'gray'}
              onClick={toggle}
            >
              <IconNote size={18} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown maw={260}>
            <Stack gap="sm">
              <Textarea
                label="Pick list note"
                minRows={2}
                autosize
                value={draftNotes}
                onChange={(event) => setDraftNotes(event.currentTarget.value)}
              />
              <Group justify="flex-end" gap="xs">
                <Button variant="default" size="xs" onClick={close}>
                  Cancel
                </Button>
                <Button
                  size="xs"
                  onClick={() => {
                    onSaveNotes(rank.team_number, draftNotes.trim());
                    close();
                  }}
                >
                  Save Changes
                </Button>
              </Group>
            </Stack>
          </Popover.Dropdown>
        </Popover>

        <ActionIcon
          aria-label={`Remove team ${rank.team_number} from pick list`}
          color="red"
          variant="subtle"
          onClick={() => onRemove(rank.team_number)}
        >
          <IconX size={18} />
        </ActionIcon>
      </div>
    </div>
  );
}

export function PickListTeamsList({
  ranks,
  eventTeamsByNumber,
  onReorder,
  onRemoveTeam,
  onUpdateNotes,
}: PickListTeamsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
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
          {ranks.map((rank, index) => (
            <SortableTeamCard
              key={rank.team_number}
              rank={rank}
              displayRank={index + 1}
              teamDetails={eventTeamsByNumber.get(rank.team_number)}
              onRemove={onRemoveTeam}
              onSaveNotes={onUpdateNotes}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
