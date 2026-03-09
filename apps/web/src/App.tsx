import {
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom';

import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ExecutionHistoryPage } from './pages/ExecutionHistoryPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { WorkflowEditorPage } from './pages/WorkflowEditorPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'workflows/:id/edit',
        element: <WorkflowEditorPage />,
      },
      {
        path: 'workflows/:id/history',
        element: <ExecutionHistoryPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
