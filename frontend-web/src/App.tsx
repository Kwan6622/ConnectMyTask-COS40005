import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { TaskBrowsePage } from './pages/TaskBrowsePage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { TaskPostPage } from './pages/TaskPostPage';
import { TrackingPage } from './pages/TrackingPage';
import { SavedTasksPage } from './pages/SavedTasksPage';
import { RequesterDashboardPage } from './pages/RequesterDashboardPage';
import { ProviderDashboardPage } from './pages/ProviderDashboardPage';
import { TaskProgressPage } from './pages/TaskProgressPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { AboutPage } from './pages/AboutPage';
import { ChatWidget } from './components/chat/ChatWidget';
import { useAuthStore } from './stores/auth.store';

function App() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="app-container">
      {!isAuthRoute && <Header />}
      <main className="flex-grow">
        <div className="page-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/my-tasks"
              element={
                user
                  ? (
                    String(user.role).toUpperCase() === 'PROVIDER'
                      ? <Navigate to="/provider-dashboard" replace />
                      : <Navigate to="/requester-dashboard" replace />
                  )
                  : <Navigate to="/" replace />
              }
            />
            <Route
              path="/profile"
              element={user ? <ProfilePage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/saved-tasks"
              element={user ? <SavedTasksPage /> : <Navigate to="/" replace />}
            />
            <Route path="/browse-tasks" element={<TaskBrowsePage />} />
            <Route path="/tasks" element={<TaskBrowsePage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/task/:id" element={<TaskDetailPage />} />
            <Route
              path="/tasks/:id/progress"
              element={user ? <TaskProgressPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/post-task"
              element={
                user
                  ? (
                    String(user.role).toUpperCase() === 'REQUESTER' || String(user.role).toUpperCase() === 'CLIENT'
                      ? <TaskPostPage />
                      : <Navigate to="/browse-tasks" replace />
                  )
                  : <Navigate to="/" replace />
              }
            />
            <Route
              path="/requester-dashboard"
              element={
                user
                  ? (
                    String(user.role).toUpperCase() === 'REQUESTER' || String(user.role).toUpperCase() === 'CLIENT'
                      ? <RequesterDashboardPage />
                      : <Navigate to="/browse-tasks" replace />
                  )
                  : <Navigate to="/" replace />
              }
            />
            <Route
              path="/provider-dashboard"
              element={
                user
                  ? (
                    String(user.role).toUpperCase() === 'PROVIDER'
                      ? <ProviderDashboardPage />
                      : <Navigate to="/browse-tasks" replace />
                  )
                  : <Navigate to="/" replace />
              }
            />
            <Route
              path="/tracking"
              element={user ? <TrackingPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin"
              element={user ? <AdminDashboard /> : <Navigate to="/" replace />}
            />
            <Route
              path="/about"
              element={<AboutPage />}
            />
            <Route
              path="/privacy-policy"
              element={<PrivacyPolicyPage />}
            />
            <Route
              path="/terms-of-service"
              element={<TermsOfServicePage />}
            />
          </Routes>
        </div>
      </main>
      {!isAuthRoute && <ChatWidget />}
      {!isAuthRoute && <Footer />}
    </div>
  );
}

export default App;
