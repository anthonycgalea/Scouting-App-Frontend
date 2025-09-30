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
  autonomousCoral?: HeadToHeadMetricSummary;
  autonomousNetAlgae?: HeadToHeadMetricSummary;
  autonomousProcessorAlgae?: HeadToHeadMetricSummary;
  autonomousPoints?: HeadToHeadMetricSummary;
  teleopCoral?: HeadToHeadMetricSummary;
  teleopGamePieces?: HeadToHeadMetricSummary;
  teleopPoints?: HeadToHeadMetricSummary;
  teleopNetAlgae?: HeadToHeadMetricSummary;
  teleopProcessorAlgae?: HeadToHeadMetricSummary;
  endgamePoints?: HeadToHeadMetricSummary;
  totalPoints?: HeadToHeadMetricSummary;
  totalNetAlgae?: HeadToHeadMetricSummary;
  endgameSuccessRate?: number | null;
};
