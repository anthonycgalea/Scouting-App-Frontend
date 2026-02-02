import { Text } from '@mantine/core';
import type { MatchSimulation2025, MatchSimulation2026, MatchSimulationResponse } from '@/api';
import { Simulation2025 } from './Simulation2025';
import { Simulation2026 } from './Simulation2026';

export type MatchSimulationData = Extract<MatchSimulationResponse, { season: number }>;

const isMatchSimulation2025 = (
  simulation: MatchSimulationData | undefined
): simulation is MatchSimulation2025 => simulation?.season === 1;
const isMatchSimulation2026 = (
  simulation: MatchSimulationData | undefined
): simulation is MatchSimulation2026 => simulation?.season === 2;

interface SimulationProps {
  simulation: MatchSimulationData;
  season?: number;
}

export const Simulation = ({ simulation, season }: SimulationProps) => {
  const resolvedSeason = season ?? simulation.season;

  if (resolvedSeason === 1 && isMatchSimulation2025(simulation)) {
    return <Simulation2025 simulation={simulation} />;
  }

  if (resolvedSeason === 2 && isMatchSimulation2026(simulation)) {
    return <Simulation2026 simulation={simulation} />;
  }

  return (
    <Text c="dimmed">Simulation details are not available for this season yet.</Text>
  );
};
