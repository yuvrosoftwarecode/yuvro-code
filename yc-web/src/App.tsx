import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CodePractice from './pages/CodePractice';
import NotFound from './pages/NotFound';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import ContentAdminDashboard from './pages/cadmin/ContentAdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import LearnAndCertify from './pages/student/LearnAndCertify';
// import CourseDetail from './components/student/CourseDetail';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />  
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />


            {/* Protected routes */}
            {/* Student Routes */}
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/learn-certify"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <LearnAndCertify />
                </ProtectedRoute>
              }
            />

            {/* <Route
              path="/student/learn/:courseId"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <CourseDetail />
                </ProtectedRoute>
              }
            /> */}

            <Route
              path="/student/code-practice"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <CodePractice />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cadmin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin", "admin_content"]}>
                  <ContentAdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />


            {/* 404 route */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
