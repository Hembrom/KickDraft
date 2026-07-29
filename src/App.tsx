import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { AdminGroupPage } from '@/pages/AdminGroupPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { ClaimPlayerPage } from '@/pages/ClaimPlayerPage';
import { GroupPage } from '@/pages/GroupPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { MatchPage } from '@/pages/MatchPage';
import { RatePlayersPage } from '@/pages/RatePlayersPage';
import { CaptainsGuidePage } from '@/pages/CaptainsGuidePage';
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
        <Route path="/guide" element={<CaptainsGuidePage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
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
        <Route path="/:slug/claim" element={<ClaimPlayerPage />} />
        <Route path="/:slug/rate" element={<RatePlayersPage />} />
        <Route path="/:slug/history" element={<HistoryPage />} />
        <Route path="/:slug/match/:matchId" element={<MatchPage />} />
        <Route path="/:slug" element={<GroupPage />} />
      </Routes>
    </Layout>
  );
}
