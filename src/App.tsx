import '@mantine/core/styles.css';

import { NavbarNested } from './components/Navbar/NavbarNested';
import { MantineProvider } from '@mantine/core';
import { Router } from './Router';
import { theme } from './theme';

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <div style={{ display: 'flex', height: '100vh' }}>
        <NavbarNested />
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Router />
        </div>
      </div>
    </MantineProvider>
  );
}
