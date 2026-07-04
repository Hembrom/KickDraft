import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { AdminGroupPage } from '@/pages/AdminGroupPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { GroupPage } from '@/pages/GroupPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { HomePage } from '@/pages/HomePage';
import { getAdminToken } from '@/lib/utils';

function AdminRoute({ children }: { children: React.ReactNode }) {
  if (!getAdminToken()) return <Navigate to="/admin" replace />;
  return children;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/groups/:slug"
          element={
            <AdminRoute>
              <AdminGroupPage />
            </AdminRoute>
          }
        />
        <Route path="/:slug/history" element={<HistoryPage />} />
        <Route path="/:slug" element={<GroupPage />} />
      </Routes>
    </Layout>
  );
}
