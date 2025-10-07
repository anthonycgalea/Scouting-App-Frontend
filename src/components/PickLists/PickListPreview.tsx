import { useEffect, useMemo, useState } from 'react';

import { ActionIcon, Box, Stack, Tabs, Text, Tooltip } from '@mantine/core';
import { IconExternalLink, IconNote } from '@tabler/icons-react';

import type { PickListRank } from '@/api/pickLists';
import type { EventTeam } from '@/api/teams';

import { TeamCommonCommentsTooltip } from '@/components/SuperScout/TeamCommonComments';

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
        const hasNotes = (rank.notes ?? '').trim().length > 0;
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
              {hasNotes ? (
                <Tooltip
                  label={teamNote}
                  withinPortal
                  withArrow
                  maw={280}
                  position="top"
                >
                  <ActionIcon
                    component="span"
                    variant="subtle"
                    color="grape"
                    aria-label={`View note for team ${rank.team_number}`}
                  >
                    <IconNote size={18} />
                  </ActionIcon>
                </Tooltip>
              ) : null}
              <TeamCommonCommentsTooltip teamNumber={rank.team_number} />
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
