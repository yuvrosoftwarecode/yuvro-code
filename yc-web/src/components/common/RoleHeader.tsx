import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown } from 'lucide-react';

interface RoleHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

const RoleHeader: React.FC<RoleHeaderProps> = ({ 
  title, 
  subtitle, 
  actions, 
  className = '' 
}) => {
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [notificationCount] = useState(3);
  const profileRef = useRef<HTMLDivElement>(null);

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

  const getProfileMenuItems = () => {
    const role = user?.role || 'instructor';
    switch (role) {
      case 'admin':
        return [
          { label: 'Settings', path: '/instructor/settings' },
          { label: 'Profile', path: '/instructor/profile' }
        ];
      case 'instructor':
        return [
          { label: 'Settings', path: '/instructor/settings' },
          { label: 'Profile', path: '/instructor/profile' }
        ];
      case 'recruiter':
        return [
          { label: 'Settings', path: '/recruiter/settings' },
          { label: 'Profile', path: '/recruiter/profile' }
        ];
      default:
        return [
          { label: 'Settings', path: '/settings' },
          { label: 'Profile', path: '/profile' }
        ];
    }
  };

  const profileMenuItems = getProfileMenuItems();

  return (
    <div className={`bg-white border-b border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Actions */}
          {actions && <div className="flex items-center space-x-3">{actions}</div>}
          
          {/* Notification Bell */}
          <button
            type="button"
            className="p-2 rounded-full text-gray-500 hover:bg-gray-50 focus:outline-none relative"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
          
          {/* User Profile Section */}
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 focus:outline-none hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-medium">
                  {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="text-sm text-left">
                  <p className="font-medium text-gray-900">{user?.username || 'User'}</p>
                  <p className="text-gray-500 capitalize">{user?.role || 'User'}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2 border border-gray-100 z-50">
                  {profileMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileMenuOpen(false);
                    }}
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
    </div>
  );
};

export default RoleHeader;