import {
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { EditorLayout } from './layouts/EditorLayout';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExecutionHistoryPage } from './pages/ExecutionHistoryPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';
import { TemplatePickerPage } from './pages/TemplatePickerPage';
import { WorkflowEditorPage } from './pages/WorkflowEditorPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <EditorLayout />,
        children: [
          {
            path: 'workflows/:id/edit',
            element: <WorkflowEditorPage />,
          },
        ],
      },
      {
        path: '/',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'workflows/new',
            element: <TemplatePickerPage />,
          },
          {
            path: 'connections',
            element: <ConnectionsPage />,
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
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
