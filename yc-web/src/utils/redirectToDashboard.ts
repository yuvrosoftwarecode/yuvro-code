import { NavigateFunction } from 'react-router-dom';

export const redirectToDashboard = (user: any, navigate: NavigateFunction) => {
  if (!user || !user.role) {
    navigate('/login');
    return;
  }

  switch (user.role) {
    case 'admin':
    case 'instructor':
      navigate('/instructor/dashboard');
      break;
    case 'recruiter':
      navigate('/recruiter/dashboard');
      break;
    case 'student':
      navigate('/student/dashboard');
      break;
    default:
      navigate('/login');
  }
};
