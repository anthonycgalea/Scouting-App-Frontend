import { useEffect, useMemo, useState } from 'react';

import { ActionIcon, Box, Popover, Stack, Tabs, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconExternalLink, IconNote } from '@tabler/icons-react';

import type { PickListRank } from '@/api/pickLists';
import type { EventTeam } from '@/api/teams';

import classes from './PickListTeamsList.module.css';

interface PickListPreviewProps {
  ranks: PickListRank[];
  eventTeamsByNumber: Map<number, EventTeam>;
  selectedTeamNumbers: Set<string>;
}

interface NormalizedPickListRanks {
  teams: PickListRank[];
  dnp: PickListRank[];
}

const recalculateRanks = (ranks: PickListRank[]) => {
  const activeRanks = ranks.filter((rank) => !rank.dnp);
  const dnpRanks = ranks.filter((rank) => rank.dnp);

  return [
    ...activeRanks.map((rank, index) => ({
      ...rank,
      rank: index + 1,
    })),
    ...dnpRanks.map((rank, index) => ({
      ...rank,
      rank: -(index + 1),
    })),
  ];
};

const normalizeRanks = (
  ranks: PickListRank[],
  selectedTeamNumbers: Set<string>,
): NormalizedPickListRanks => {
  const sortedRanks = [...ranks].sort((first, second) => {
    if (first.dnp === second.dnp) {
      if (first.dnp) {
        return Math.abs(first.rank) - Math.abs(second.rank);
      }

      return first.rank - second.rank;
    }

    return first.dnp ? 1 : -1;
  });

  const recalculated = recalculateRanks(sortedRanks).map((rank) => ({
    ...rank,
    notes: rank.notes?.trim() ?? '',
  }));

  const filtered = recalculated.filter(
    (rank) => !selectedTeamNumbers.has(String(rank.team_number)),
  );

  return {
    teams: filtered.filter((rank) => !rank.dnp),
    dnp: filtered.filter((rank) => rank.dnp),
  };
};

function TeamNotesPopover({
  teamNumber,
  note,
}: {
  teamNumber: number;
  note: string;
}) {
  const hasNotes = note.trim().length > 0;
  const [opened, { toggle, close, open }] = useDisclosure(false);

  return (
    <Popover
      opened={opened}
      onChange={(isOpen) => (isOpen ? open() : close())}
      withArrow
      shadow="md"
      position="top"
      withinPortal
    >
      <Popover.Target>
        <Tooltip
          label={hasNotes ? 'View notes' : 'No notes available'}
          withinPortal
          withArrow
        >
          <ActionIcon
            aria-label={
              hasNotes
                ? `View note for team ${teamNumber}`
                : `No notes for team ${teamNumber}`
            }
            variant="subtle"
            color={hasNotes ? 'green' : 'gray'}
            onClick={toggle}
          >
            <IconNote size={18} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown maw={260}>
        {hasNotes ? (
          <Text size="sm">{note}</Text>
        ) : (
          <Text size="sm" c="dimmed">
            No notes have been added for this team yet.
          </Text>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}

function PickListPreviewSection({
  ranks,
  eventTeamsByNumber,
  emptyLabel,
}: {
  ranks: PickListRank[];
  eventTeamsByNumber: Map<number, EventTeam>;
  emptyLabel: string;
}) {
  if (ranks.length === 0) {
    return (
      <Box px="xs">
        <Text c="dimmed" ta="center">
          {emptyLabel}
        </Text>
      </Box>
    );
  }

  return (
    <div className={classes.list}>
      {ranks.map((rank) => {
        const teamDetails = eventTeamsByNumber.get(rank.team_number);
        const teamNote = (rank.notes ?? '').trim();

        return (
          <div key={rank.team_number} className={classes.item}>
            <div className={classes.teamInfo}>
              <div className={classes.rankAndNumber}>
                {!rank.dnp && (
                  <Text className={classes.rankValue}>{rank.rank}</Text>
                )}
                <Text className={classes.teamNumber}>{rank.team_number}</Text>
              </div>
              <div className={classes.teamDetails}>
                <Text
                  className={classes.teamName}
                  title={teamDetails?.team_name ?? 'Team information unavailable'}
                >
                  {teamDetails?.team_name ?? 'Team information unavailable'}
                </Text>
              </div>
            </div>
            <div className={classes.actions}>
              <TeamNotesPopover teamNumber={rank.team_number} note={teamNote} />
              <Tooltip
                label={`Open team ${rank.team_number} page`}
                withinPortal
                withArrow
                position="top"
              >
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PickListPreview({
  ranks,
  eventTeamsByNumber,
  selectedTeamNumbers,
}: PickListPreviewProps) {
  const { teams, dnp } = useMemo(
    () => normalizeRanks(ranks, selectedTeamNumbers),
    [ranks, selectedTeamNumbers],
  );
  const [activeTab, setActiveTab] = useState<'teams' | 'dnp'>(
    teams.length > 0 ? 'teams' : 'dnp',
  );
  const hasDnpTeams = dnp.length > 0;

  useEffect(() => {
    if (!hasDnpTeams && activeTab === 'dnp') {
      setActiveTab('teams');
      return;
    }

    if (hasDnpTeams && activeTab === 'dnp' && dnp.length === 0) {
      setActiveTab('teams');
    }
  }, [activeTab, hasDnpTeams, dnp.length]);

  useEffect(() => {
    if (activeTab === 'teams' && teams.length === 0 && hasDnpTeams) {
      setActiveTab('dnp');
    }
  }, [activeTab, teams.length, hasDnpTeams]);

  if (!hasDnpTeams) {
    return (
      <Stack gap="sm">
        <PickListPreviewSection
          ranks={teams}
          eventTeamsByNumber={eventTeamsByNumber}
          emptyLabel="No teams available in this pick list."
        />
      </Stack>
    );
  }

  return (
    <Tabs value={activeTab} onChange={(value) => setActiveTab(value as 'teams' | 'dnp')}>
      <Tabs.List>
        <Tabs.Tab value="teams">Teams</Tabs.Tab>
        <Tabs.Tab value="dnp">DNP</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="teams" pt="sm">
        <PickListPreviewSection
          ranks={teams}
          eventTeamsByNumber={eventTeamsByNumber}
          emptyLabel="No teams available in this pick list."
        />
      </Tabs.Panel>
      <Tabs.Panel value="dnp" pt="sm">
        <PickListPreviewSection
          ranks={dnp}
          eventTeamsByNumber={eventTeamsByNumber}
          emptyLabel="No teams marked as DNP."
        />
      </Tabs.Panel>
    </Tabs>
  );
}
