import { Center, Image } from '@mantine/core';
import CodyStatsTransparent from '@/assets/CodyStatsTransparent.png';

export function Welcome() {
  return (
    <Center mt={100}>
      <Image src={CodyStatsTransparent} alt="CodyStats logo" maw={400} fit="contain" />
    </Center>
  );
}
