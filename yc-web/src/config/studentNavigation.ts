import { NavigateFunction } from 'react-router-dom';

export interface NavigationMenuItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
  dropdown?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export interface StudentNavigationConfig {
  getMenuItems: (navigate: NavigateFunction, activePage: string) => NavigationMenuItem[];
}

const studentNavigationConfig: StudentNavigationConfig = {
  getMenuItems: (navigate: NavigateFunction, activePage: string) => [
    { 
      label: 'Learn/Certify', 
      onClick: () => navigate('/student/learn-certify'), 
      active: activePage === 'learn-certify' 
    },
    { 
      label: 'Code Practice', 
      onClick: () => navigate('/student/code-practice'), 
      active: activePage === 'code-practice' 
    },
    { 
      label: 'Skill Test', 
      onClick: () => navigate('/student/skill-test'), 
      active: activePage === 'skill-test' 
    },
    { 
      label: 'Mock Interview', 
      onClick: () => navigate('/student/mock-interview'), 
      active: activePage === 'mock-interview' 
    },
    { 
      label: 'Jobs', 
      onClick: () => navigate('/student/jobs'), 
      active: activePage === 'jobs' 
    },
    { 
      label: 'Contest', 
      onClick: () => navigate('/student/contest'), 
      active: activePage === 'contest' 
    },
  ]
};

export default studentNavigationConfig;
