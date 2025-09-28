import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';

import { RouterProvider } from '@tanstack/react-router';
import { AuthProvider } from './auth/AuthProvider';
import { ApiProvider } from './api';
import { router } from './Router';

export default function App() {
  return (
    <AuthProvider>
      <ApiProvider>
        <RouterProvider router={router} />
      </ApiProvider>
    </AuthProvider>
  );
}
