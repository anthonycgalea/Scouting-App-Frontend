import { Center, Loader } from '@mantine/core';
import { useAuth } from '../auth/AuthProvider';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { SocialLogins } from '../components/SocialLogins/SocialLogins';
import { Welcome } from '../components/Welcome/Welcome';

export function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  }

  return (
    <>
      <Welcome />
      {user ? <ColorSchemeToggle /> : <SocialLogins />}
    </>
  );
}
