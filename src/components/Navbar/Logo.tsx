import { Image, type ImageProps, useMantineColorScheme } from '@mantine/core';
import CodyStatsTitle from '@/assets/CodyStatsTitle.png';
import CodyStatsTitleWhite from '@/assets/CodyStatsTitleWhite.png';

export function Logo(props: ImageProps) {
  const { colorScheme } = useMantineColorScheme();
  const logoSrc = colorScheme === 'dark' ? CodyStatsTitleWhite : CodyStatsTitle;

  return <Image src={logoSrc} alt="CodyStats title" fit="contain" {...props} />;
}
