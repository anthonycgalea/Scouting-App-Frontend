import { Button, ButtonProps, Group } from '@mantine/core';
import { DiscordIcon } from '@mantinex/dev-icons';
import { GoogleIcon } from './GoogleIcon';
import classes from './SocialLogins.module.css';

export function GoogleButton(props: ButtonProps & React.ComponentPropsWithoutRef<'button'>) {
  return <Button leftSection={<GoogleIcon />} variant="default" {...props} />;
}

export function DiscordButton(props: ButtonProps & React.ComponentPropsWithoutRef<'button'>) {
  return (
    <Button className={classes.discordButton} leftSection={<DiscordIcon size={16} />} {...props} />
  );
}

export function SocialLogins() {
  return (
    <Group justify="center" p="md">
      <GoogleButton>Continue with Google</GoogleButton>
      <DiscordButton>Login through Discord</DiscordButton>
    </Group>
  );
}