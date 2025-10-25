import { Image, type ImageProps } from '@mantine/core';
import CodyStatsTitle from '@/assets/CodyStatsTitle.png';

export function Logo(props: ImageProps) {
  return <Image src={CodyStatsTitle} alt="CodyStats title" fit="contain" {...props} />;
}
