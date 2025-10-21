import { Button, ButtonProps, Group } from '@mantine/core';
import { DiscordIcon } from '@mantinex/dev-icons';
import { IconBrandSlack, IconBrandTeams } from '@tabler/icons-react';
import { useAuth } from '../../auth/AuthProvider';
import classes from './SocialLogins.module.css';

export function DiscordButton(props: ButtonProps & React.ComponentPropsWithoutRef<'button'>) {
  return (
    <Button className={classes.discordButton} leftSection={<DiscordIcon size={16} />} {...props} />
  );
}

export function SlackButton(props: ButtonProps & React.ComponentPropsWithoutRef<'button'>) {
  return (
    <Button className={classes.slackButton} leftSection={<IconBrandSlack size={16} />} {...props} />
  );
}

export function TeamsButton(props: ButtonProps & React.ComponentPropsWithoutRef<'button'>) {
  return (
    <Button className={classes.teamsButton} leftSection={<IconBrandTeams size={16} />} {...props} />
  );
}

export function SocialLogins() {
  const { loginWithDiscord, loginWithSlack, loginWithAzure } = useAuth();

  return (
    <Group justify="center" p="md">
      <DiscordButton onClick={loginWithDiscord}>Login through Discord</DiscordButton>
      <SlackButton onClick={loginWithSlack}>Login through Slack</SlackButton>
      <TeamsButton onClick={loginWithAzure}>Sign in with Teams</TeamsButton>
    </Group>
  );
}
