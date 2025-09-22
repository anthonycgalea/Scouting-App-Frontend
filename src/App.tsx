import '@mantine/core/styles.css';

import { RouterProvider } from '@tanstack/react-router';
import { ApiProvider } from './api';
import { router } from './Router';

export default function App() {
  return (
    <ApiProvider>
      <RouterProvider router={router} />
    </ApiProvider>
  );
}
