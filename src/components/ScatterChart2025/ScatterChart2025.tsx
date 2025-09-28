import { ScatterChart } from '@mantine/charts';
const data = [
  {
    color: 'blue.5',
    name: 'Group 1',
    data: [
      { teleop: 25, autoEndgame: 20 },
      { teleop: 30, autoEndgame: 22 },
      { teleop: 35, autoEndgame: 18 },
      { teleop: 40, autoEndgame: 25 },
      { teleop: 45, autoEndgame: 30 },
      { teleop: 28, autoEndgame: 15 },
      { teleop: 22, autoEndgame: 12 },
      { teleop: 50, autoEndgame: 28 },
      { teleop: 32, autoEndgame: 19 },
      { teleop: 48, autoEndgame: 31 },
      { teleop: 26, autoEndgame: 24 },
      { teleop: 38, autoEndgame: 27 },
      { teleop: 42, autoEndgame: 29 },
      { teleop: 29, autoEndgame: 16 },
      { teleop: 34, autoEndgame: 23 },
      { teleop: 44, autoEndgame: 33 },
      { teleop: 23, autoEndgame: 14 },
      { teleop: 37, autoEndgame: 26 },
      { teleop: 49, autoEndgame: 34 },
      { teleop: 27, autoEndgame: 17 },
      { teleop: 41, autoEndgame: 32 },
      { teleop: 31, autoEndgame: 21 },
      { teleop: 46, autoEndgame: 35 },
      { teleop: 24, autoEndgame: 13 },
      { teleop: 33, autoEndgame: 22 },
      { teleop: 39, autoEndgame: 28 },
      { teleop: 47, autoEndgame: 30 },
      { teleop: 36, autoEndgame: 25 },
      { teleop: 43, autoEndgame: 29 },
      { teleop: 21, autoEndgame: 11 },
    ],
  },
];
export function ScatterChart2025() {
  return (
    <ScatterChart
      h={350}
      data={data}
      dataKey={{ x: 'teleop', y: 'autoEndgame' }}
      xAxisLabel="Teleop"
      yAxisLabel="Auto and Endgame"
      pointLabels="x"
    />
  );
}