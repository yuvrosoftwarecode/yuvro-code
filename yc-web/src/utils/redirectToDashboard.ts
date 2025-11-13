import { NavigateFunction } from 'react-router-dom';

export const redirectToDashboard = (user: any, navigate: NavigateFunction) => {
  if (!user || !user.role) {
    navigate('/login');
    return;
  }

  switch (user.role) {
    case 'admin':
      navigate('/admin/dashboard');
      break;
    case 'admin_content':
      navigate('/cadmin/dashboard');
      break;
    case 'student':
      navigate('/student/dashboard');
      break;
    default:
      navigate('/login');
  }
};
