import '@mantine/core/styles.css';

import { RouterProvider } from '@tanstack/react-router';
import { router } from './Router';

export default function App() {
  return <RouterProvider router={router}/>;
}
