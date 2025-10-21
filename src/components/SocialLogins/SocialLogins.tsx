import { Button, ButtonProps, Group } from '@mantine/core';
import { DiscordIcon } from '@mantinex/dev-icons';
import { useAuth } from '../../auth/AuthProvider';
import classes from './SocialLogins.module.css';

export function DiscordButton(props: ButtonProps & React.ComponentPropsWithoutRef<'button'>) {
  return (
    <Button className={classes.discordButton} leftSection={<DiscordIcon size={16} />} {...props} />
  );
}

export function SocialLogins() {
  const { loginWithDiscord } = useAuth();

  return (
    <Group justify="center" p="md">
      <DiscordButton onClick={loginWithDiscord}>Login through Discord</DiscordButton>
    </Group>
  );
}
