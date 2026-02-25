export type TeamPerformanceSummary = {
  teamNumber: number;
  matchesPlayed: number;
  autonomousAverage: number;
  teleopAverage: number;
  endgameAverage: number;
  gamePieceAverage: number;
  totalAverage: number;
  teamName?: string;
};

export type QuartileSummary = {
  min: number;
  lowerQuartile: number;
  median: number;
  upperQuartile: number;
  max: number;
  average: number;
};

export type TeamDistributionSummary = {
  teamNumber: number;
  teamName?: string;
  matchesPlayed: number;
  autonomous: QuartileSummary;
  teleop: QuartileSummary;
  gamePieces: QuartileSummary;
  total: QuartileSummary;
};

export type HeadToHeadMetricSummary = {
  min: number;
  max: number;
  median: number;
  average: number;
  stdev: number;
};

export type TeamHeadToHeadSummary = {
  teamNumber: number;
  teamName?: string;
  matchesPlayed: number;
  autonomousFuelScored?: HeadToHeadMetricSummary;
  autonomousFuelPassed?: HeadToHeadMetricSummary;
  autonomousAutoClimb?: HeadToHeadMetricSummary;
  autonomousPoints?: HeadToHeadMetricSummary;
  teleopFuelScored?: HeadToHeadMetricSummary;
  teleopFuelPassed?: HeadToHeadMetricSummary;
  teleopPoints?: HeadToHeadMetricSummary;
  endgameClimb?: HeadToHeadMetricSummary;
  endgamePoints?: HeadToHeadMetricSummary;
  totalPoints?: HeadToHeadMetricSummary;
  endgameSuccessRate?: number | null;
};
