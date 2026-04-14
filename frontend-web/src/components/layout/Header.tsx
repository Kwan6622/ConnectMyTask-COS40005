import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { useTaskStore } from '../../stores/task.store';
import { Button } from '../common/Button';
import { api } from '../../services/api';
import { 
  BellIcon, 
  BookmarkIcon,
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface HeaderNotification {
  id: string;
  createdAt: string;
  title?: string;
  message: string;
  isRead?: boolean;
  task?: { id: string | number; title?: string };
  sender?: {
    id: string | number;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    skills?: string;
    profilePhotoUrl?: string;
  };
}

interface HeaderSavedTaskItem {
  id: string;
  task: {
    id: string | number;
    title: string;
    budget?: number | null;
    location?: string;
    createdBy?: {
      name?: string;
    };
    client?: {
      fullName?: string;
    };
  };
}

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    setFilters,
    clearFilters,
    savedTasks,
    fetchSavedTasks,
  } = useTaskStore();
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSavedTasks, setShowSavedTasks] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<HeaderNotification | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [lastNotificationViewedAt, setLastNotificationViewedAt] = useState<string>(() => {
    try {
      return localStorage.getItem('cmt-last-notification-viewed-at') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem('cmt-last-notification-viewed-at', lastNotificationViewedAt);
  }, [lastNotificationViewedAt]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        const response = await api.notifications.getMine();
        const rawData = response.data;
        const items = Array.isArray(rawData) ? rawData : rawData.items || [];
        const mapped: HeaderNotification[] = items.slice(0, 10).map((item: any) => ({
          id: String(item.id),
          createdAt: item.createdAt || '',
          title: item.task?.title,
          message: item.message,
          isRead: item.isRead,
          task: item.task,
          sender: item.sender,
        }));

        setNotifications(mapped);
        const lastViewedMs = lastNotificationViewedAt ? new Date(lastNotificationViewedAt).getTime() : 0;
        const unseen = mapped.filter((item) => {
          if (item.isRead) return false;
          return new Date(item.createdAt || 0).getTime() > lastViewedMs;
        }).length;
        setUnreadCount(unseen);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    fetchNotifications();
  }, [lastNotificationViewedAt, user]);

  useEffect(() => {
    const loadSavedTasks = async () => {
      if (!user) {
        return;
      }

      try {
        await fetchSavedTasks();
      } catch (error) {
        console.error('Failed to fetch saved tasks:', error);
      }
    };

    loadSavedTasks();
  }, [user, location.pathname, fetchSavedTasks]);

  const handleToggleNotifications = () => {
    const willOpen = !showNotifications;
    setShowNotifications(willOpen);
    setShowSavedTasks(false);
    if (willOpen && notifications.length > 0) {
      setLastNotificationViewedAt(new Date().toISOString());
      setUnreadCount(0);
    }
  };

  const handleToggleSavedTasks = () => {
    const willOpen = !showSavedTasks;
    setShowSavedTasks(willOpen);
    setShowNotifications(false);
  };

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearFilters();
    setFilters({ search: headerSearch.trim() || undefined });
    navigate('/browse-tasks');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;
  const savedTaskCount = savedTasks.length;
  const role = String(user?.role || '').toUpperCase();
  const isRequester = role === 'REQUESTER' || role === 'CLIENT';
  const isProvider = role === 'PROVIDER';

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg' 
        : 'bg-white border-b border-gray-100'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-bold text-lg">CMT</span>
              <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">ConnectMyTask</span>
              <div className="text-xs text-gray-500">AI-Powered Matching</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link 
              to="/browse-tasks" 
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive('/browse-tasks')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Browse Tasks
            </Link>
            {isRequester && (
              <Link
                to="/post-task"
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/post-task')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Post Task
              </Link>
            )}
            {isRequester && (
              <Link
                to="/requester-dashboard"
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/requester-dashboard')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                My Posted Tasks
              </Link>
            )}
            {isRequester && (
              <Link
                to="/requester-dashboard#progress"
                className="px-4 py-2 rounded-lg font-medium transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              >
                Task Progress
              </Link>
            )}
            {isProvider && (
              <Link
                to="/provider-dashboard"
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/provider-dashboard')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                My Active Tasks
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link 
                to="/admin" 
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/admin')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            {/* Search Bar - Desktop */}
            <div className="hidden md:flex items-center">
              <form onSubmit={handleHeaderSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>

            {user ? (
              <>
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={handleToggleNotifications}
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
                  aria-label="Open notifications"
                >
                  <BellIcon className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-gray-500">No new notifications</p>
                    ) : (
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.map((item) => (
                          <button
                            key={item.id}
                            onClick={async () => {
                              setSelectedNotification(item);
                              try {
                                await api.notifications.markRead(String(item.id));
                              } catch {
                                // Ignore mark-read failure because user can still open details.
                              }
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.sender?.name
                                ? `Provider ${item.sender.name} wants to contact you`
                                : (item.title || 'New notification')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{item.message}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Saved Tasks */}
              <div className="relative">
                <button
                  onClick={handleToggleSavedTasks}
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
                  aria-label="Open saved tasks"
                >
                  <BookmarkIcon className="w-6 h-6" />
                  {savedTaskCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                      {savedTaskCount > 9 ? '9+' : savedTaskCount}
                    </span>
                  )}
                </button>

                {showSavedTasks && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">Saved Tasks</p>
                      <button
                        onClick={() => {
                          setShowSavedTasks(false);
                          navigate('/saved-tasks');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all
                      </button>
                    </div>
                    {savedTasks.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-gray-500">No saved tasks yet</p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {(savedTasks as HeaderSavedTaskItem[]).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setShowSavedTasks(false);
                              navigate(`/tasks/${item.task.id}`);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <p className="text-sm font-medium text-gray-900 truncate">{item.task.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Budget: {item.task.budget != null ? `${item.task.budget.toLocaleString()} đ` : 'Flexible'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.task.location || 'No location'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Posted by {item.task.createdBy?.name || item.task.client?.fullName || 'Anonymous'}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="relative">
                    {user.profilePhotoUrl ? (
                      <img
                        src={user.profilePhotoUrl}
                        alt={user.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <UserCircleIcon className="w-8 h-8 text-gray-400" />
                    )}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {user.role}
                    </p>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <UserCircleIcon className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="text-sm font-medium">Profile</span>
                    </Link>
                    <Link
                      to={isProvider ? '/provider-dashboard' : '/requester-dashboard'}
                      className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm font-medium">
                        {isProvider ? 'My Active Tasks' : 'My Posted Tasks'}
                      </span>
                    </Link>
                    <Link
                      to="/saved-tasks"
                      className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
                      </svg>
                      <span className="text-sm font-medium">Saved Tasks</span>
                    </Link>
                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="hidden md:flex border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Get Started
                </Button>
                
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-50"
                >
                  {showMobileMenu ? (
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                  ) : (
                    <Bars3Icon className="w-6 h-6 text-gray-600" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {selectedNotification && (
          <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl border border-gray-100 shadow-xl">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Provider Contact Request</p>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Close
                </button>
              </div>
              <div className="px-5 py-4 space-y-2">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Provider:</span> {selectedNotification.sender?.name || 'Unknown'}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Email:</span> {selectedNotification.sender?.email || 'Not available'}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Phone:</span> {selectedNotification.sender?.phone || 'Not available'}
                </p>
                {selectedNotification.sender?.skills && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Skills:</span> {selectedNotification.sender.skills}
                  </p>
                )}
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Task:</span> {selectedNotification.task?.title || 'No task title'}
                </p>
                <p className="text-xs text-gray-500 pt-1">{selectedNotification.message}</p>
              </div>
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedNotification(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const taskId = selectedNotification.task?.id;
                    setSelectedNotification(null);
                    setShowNotifications(false);
                    if (taskId != null) {
                      navigate(`/tasks/${taskId}`);
                    }
                  }}
                >
                  View Task
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-100 py-4 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/browse-tasks" 
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive('/browse-tasks')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                Browse Tasks
              </Link>
              {isRequester && (
                <Link
                  to="/post-task"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive('/post-task')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Post Task
                </Link>
              )}
              {isRequester && (
                <Link
                  to="/requester-dashboard"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive('/requester-dashboard')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  My Posted Tasks
                </Link>
              )}
              {isRequester && (
                <Link
                  to="/requester-dashboard#progress"
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Task Progress
                </Link>
              )}
              {isProvider && (
                <Link
                  to="/provider-dashboard"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive('/provider-dashboard')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  My Active Tasks
                </Link>
              )}
              {!user && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate('/login');
                      setShowMobileMenu(false);
                    }}
                    className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => {
                      navigate('/register');
                      setShowMobileMenu(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
