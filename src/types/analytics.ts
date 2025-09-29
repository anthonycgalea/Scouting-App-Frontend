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
