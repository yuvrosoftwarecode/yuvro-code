import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  X,
  Search,
  Briefcase,
  Users,
  Calendar,
  TrendingUp,
  BookOpen,
  Settings,
  Trophy,
  UserCheck,
  BarChart3,
  FileText,
  HelpCircle
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    path: '/instructor/dashboard',
    roles: ['admin', 'instructor', 'recruiter']
  },
  {
    id: 'users',
    label: 'User Management',
    icon: UserCheck,
    path: '/instructor/users',
    roles: ['admin']
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: BookOpen,
    path: '/instructor/courses',
    roles: ['admin', 'instructor']
  },
  {
    id: 'recruiter-jobs',
    label: 'Jobs',
    icon: Briefcase,
    path: '/recruiter/jobs',
    roles: ['recruiter']
  },
  {
    id: 'search',
    label: 'Job Search',
    icon: Search,
    path: '/job_search',
    roles: ['recruiter']
  },
  {
    id: 'candidates',
    label: 'Candidates',
    icon: Users,
    path: '/candidates',
    roles: ['recruiter']
  },
  {
    id: 'contests',
    label: 'Contests',
    icon: Trophy,
    path: '/instructor/contests',
    roles: ['admin', 'instructor', 'recruiter']
  },
  {
    id: 'assessment',
    label: 'Assessment',
    icon: Calendar,
    path: '/assessment',
    roles: ['instructor', 'recruiter']
  },
  {
    id: 'mock-interview',
    label: 'Mock Interview',
    icon: TrendingUp,
    path: '/mock-interview',
    roles: ['admin', 'instructor', 'recruiter']
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/instructor/settings',
    roles: ['admin', 'instructor', 'recruiter']
  }
];

interface RoleSidebarProps {
  className?: string;
}

const RoleSidebar: React.FC<RoleSidebarProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const userRole = user?.role || 'instructor';

  // Filter items based on user role
  const filteredItems = sidebarItems.filter(item => item.roles.includes(userRole));

  // Get portal title based on role
  const getPortalTitle = () => {
    switch (userRole) {
      case 'admin':
        return 'ADMIN PORTAL';
      case 'instructor':
        return 'INSTRUCTOR PORTAL';
      case 'recruiter':
        return 'RECRUITER PORTAL';
      default:
        return 'PORTAL';
    }
  };

  // Get tools section based on role
  const getToolsSection = () => {
    switch (userRole) {
      case 'admin':
        return {
          title: 'Admin Tools',
          description: 'Access administrative features for system management'
        };
      case 'instructor':
        return {
          title: 'Instructor Tools',
          description: ''
        };
      case 'recruiter':
        return {
          title: 'Recruiter Tools',
          description: 'Access specialized features for recruitment'
        };
      default:
        return {
          title: 'Tools',
          description: 'Access specialized features'
        };
    }
  };

  const isActiveItem = (item: SidebarItem) => {
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  const toolsSection = getToolsSection();

  return (
    <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-sm border-r border-gray-200 min-h-screen transition-all duration-300 ease-in-out ${className}`}>
      <div className="p-4">
        {/* Header with toggle button */}
        <div className="flex items-center justify-between mb-6">
          {!sidebarCollapsed && (
            <h2 className="text-lg font-semibold text-gray-800">{getPortalTitle()}</h2>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>

        <nav className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveItem(item);

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer group relative transition-colors ${isActive
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
                title={sidebarCollapsed ? item.label : ''}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default RoleSidebar;