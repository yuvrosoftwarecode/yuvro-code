import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/landing/Landing';
import Home from './pages/landing/Home';
import About from './pages/landing/About';
import Login from './pages/common/Login';
import Register from './pages/common/Register';
import CommonDashboard from './pages/common/Dashboard';
import Profile from './pages/common/Profile';
import CodePractice from './pages/student/CodePractice';
import NotFound from './pages/common/NotFound';
import ResetPassword from './pages/common/ResetPassword';
import ForgotPassword from './pages/common/ForgotPassword';
import InstructorDashboard from './pages/instructor/Dashboard';
import Courses from './pages/instructor/Courses';
import CourseEdit from './pages/instructor/CourseEdit';
import Jobs from './pages/instructor/Jobs';
import Users from './pages/instructor/Users';
import RecruiterDashboard from './pages/recruiter/Dashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import LearnAndCertify from './pages/student/LearnAndCertify';
import CourseDetail from './components/student/CourseDetail';
import { Toaster } from "@/components/ui/sonner";




function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/about" element={<About />} />
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

            <Route
              path="/student/learn/:courseId"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <CourseDetail />
                </ProtectedRoute>
              }
            />

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
                <ProtectedRoute allowedRoles={["admin", "instructor", "recruiter"]}>
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute allowedRoles={["admin", "instructor"]}>
                  <Courses />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/courses/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "instructor"]}>
                  <CourseEdit />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/jobs"
              element={
                <ProtectedRoute allowedRoles={["admin", "instructor", "recruiter"]}>
                  <Jobs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Users />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/batches"
              element={
                <ProtectedRoute allowedRoles={["admin", "instructor"]}>
                  <div>Batches Management</div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRoles={["admin", "instructor"]}>
                  <div>Students Management</div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/practice-questions"
              element={
                <ProtectedRoute allowedRoles={["admin", "instructor"]}>
                  <div>Practice Questions Management</div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/test-questions"
              element={
                <ProtectedRoute allowedRoles={["admin", "instructor"]}>
                  <div>Test Questions Management</div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={["admin", "instructor", "recruiter"]}>
                  <div>Settings</div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute allowedRoles={["admin", "instructor", "recruiter"]}>
                  <div>Profile</div>
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
          <Toaster position="top-right" />
        </div>
      </Router>

    </AuthProvider>
  );
}

export default App;
