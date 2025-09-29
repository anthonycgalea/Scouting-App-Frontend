import { useMemo } from 'react';
import { useMantineColorScheme, useMantineTheme, rgba } from '@mantine/core';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Page D',
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

const sortByTotalDescending = (a: typeof data[number], b: typeof data[number]) => {
  const totalA = a.pv + a.uv;
  const totalB = b.pv + b.uv;

  return totalB - totalA;
};

const sortedData = [...data].sort(sortByTotalDescending);


const BarChart2025 = () => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const tooltipContentStyle = useMemo(
    () => ({
      backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
      borderColor: colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3],
      color: colorScheme === 'dark' ? theme.colors.gray[1] : theme.colors.dark[7],
    }),
    [colorScheme, theme]
  );

  const cursorFill = useMemo(
    () =>
      colorScheme === 'dark'
        ? rgba(theme.colors.dark[3], 0.45)
        : rgba(theme.colors.gray[3], 0.35),
    [colorScheme, theme]
  );
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        width={500}
        height={300}
        data={sortedData}
        layout="vertical"
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" />
        <Tooltip contentStyle={tooltipContentStyle} cursor={{ fill: cursorFill }} />
        <Legend />
        <Bar dataKey="pv" stackId="a" fill="#8884d8" />
        <Bar dataKey="uv" stackId="a" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChart2025;
