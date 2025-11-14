import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const profileRef = useRef<HTMLDivElement>(null);

  // ✅ Role-based navigation setup
  const role = user?.role || 'student';

  const roleTabs: Record<string, { label: string; path: string }[]> = {
    student: [
      { label: 'Dashboard', path: '/student/dashboard' },
      { label: 'Learn / Certify', path: '/student/learn-certify' },
      { label: 'Code Practice', path: '/student/code-practice' },
      { label: 'Skill Test', path: '/student/skill-test' },
      { label: 'Mock Interview', path: '/student/mock-interview' },
      { label: 'Jobs', path: '/student/jobs' },
      { label: 'Contest', path: '/student/contest' },
    ],
    admin: [
      { label: 'Dashboard', path: '/admin/dashboard' },
      { label: 'Courses', path: '/admin/courses' },
      { label: 'Batches', path: '/admin/batches' },
      { label: 'Students', path: '/admin/students' },
      { label: 'Practice Questions', path: '/admin/practice-questions' },
      { label: 'Test Questions', path: '/admin/test-questions' }, 
      { label: 'Add Admin/Content Admin', path: '/admin/add-admin-content-admin' }, 

    ],
    admin_content: [
      { label: 'Dashboard', path: '/cadmin/dashboard' },
      { label: 'Courses', path: '/cadmin/courses' },
      { label: 'Batches', path: '/cadmin/batches' },
      { label: 'Students', path: '/cadmin/students' },
      { label: 'Practice Questions', path: '/cadmin/practice-questions' },
      { label: 'Test Questions', path: '/cadmin/test-questions' }, 
    ],
  };

  const roleProfileMenu: Record<string, { label: string; path: string }[]> = {
    student: [
      { label: 'Certifications', path: '/student/certifications' },
      { label: 'Profile', path: '/student/profile' },
    ],
    admin: [
      { label: 'Admin Settings', path: '/admin/settings' },
      { label: 'Profile', path: '/admin/profile' },
    ],
    content_admin: [
      { label: 'Upload History', path: '/content/uploads' },
      { label: 'Profile', path: '/content/profile' },
    ],
  };

  const mainTabs = roleTabs[role] || [];
  const profileMenu = roleProfileMenu[role] || [];

  const handleLogout = () => logout();

  // Redirect base route
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const currentPath = location.pathname;

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="w-full mx-auto px-2 sm:px-3 lg:px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo + Tabs */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-foreground-700">Yuvro</span>
            </Link>

            {/* Tabs */}
            <div className="hidden md:flex space-x-3 ml-3">
              {mainTabs.map((tab) => {
               const isActive =
                  currentPath === tab.path || currentPath.startsWith(tab.path + "/");

                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${
                      isActive
                        ? 'bg-black text-white ring-1 ring-black'
                        : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Hamburger + Notification + Profile */}
          <div className="flex items-center space-x-4">
            {/* Hamburger */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              className="p-2 rounded-full text-black-500 hover:bg-indigo-50 focus:outline-none relative"
              aria-label="View notifications"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center focus:outline-none"
              >
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-medium">
                  {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 border border-gray-100">
                  {profileMenu.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-inner">
          <div className="px-4 py-3 space-y-2">
            {mainTabs.map((tab) => {
              const isActive =
  currentPath === tab.path || currentPath.startsWith(tab.path + "/");

              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-700 focus-visible:ring-offset-2 h-10 px-3 py-2 ${
                    isActive
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:text-black'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
