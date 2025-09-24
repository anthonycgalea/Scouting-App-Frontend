declare module '@mantinex/dev-icons' {
  import { ComponentType } from 'react';

  interface MantinexIconProps {
    size?: number;
    color?: string;
    className?: string;
  }

  export const DiscordIcon: ComponentType<MantinexIconProps>;
}
