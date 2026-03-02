import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MyTasksPage } from './pages/MyTasksPage';
import { ProfilePage } from './pages/ProfilePage';
import { TaskBrowsePage } from './pages/TaskBrowsePage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { TaskPostPage } from './pages/TaskPostPage';
import { TrackingPage } from './pages/TrackingPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { AboutPage } from './pages/AboutPage';
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
            <Route
              path="/"
              element={user ? <HomePage /> : <Navigate to="/login" replace />}
            />
            <Route path="/home" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route
              path="/my-tasks"
              element={user ? <MyTasksPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/profile"
              element={user ? <ProfilePage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/browse-tasks"
              element={user ? <TaskBrowsePage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/tasks"
              element={user ? <TaskBrowsePage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/tasks/:id"
              element={user ? <TaskDetailPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/task/:id"
              element={user ? <TaskDetailPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/post-task"
              element={user ? <TaskPostPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/tracking"
              element={user ? <TrackingPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/admin"
              element={user ? <AdminDashboard /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/about"
              element={user ? <AboutPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/privacy-policy"
              element={user ? <PrivacyPolicyPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/terms-of-service"
              element={user ? <TermsOfServicePage /> : <Navigate to="/login" replace />}
            />
          </Routes>
        </div>
      </main>
      {!isAuthRoute && <Footer />}
    </div>
  );
}

export default App;
