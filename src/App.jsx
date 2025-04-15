import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './Contexts/AuthContext';
import Landing from './components/LandingPage/Home';
import SignupPage from './components/accounts'; 
import ListenerDashboard from './components/Users/ListenerDashboard';
import ArtistDashboard from './components/Users/ArtistDashboard';
import Player from './components/Player';
import { AuthProvider } from './Contexts/AuthProvider';
import ForgotPassword from './components/ForgotPassword';
import Login from './components/Login';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
};

// Role-based route wrapper
const RoleRoute = ({ role }) => {
  const { userRole } = useAuth();
  return userRole === role ? <Outlet /> : <Navigate to="/" replace />;
};

// Main layout with player
const ProtectedLayout = () => {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <Player />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signup/listener" element={<SignupPage role="listener" />} />
          <Route path="/signup/artist" element={<SignupPage role="artist" />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
            {/* Listener routes */}
            <Route element={<RoleRoute role="listener" />}>
              <Route path="/listener-dashboard" element={<ListenerDashboard />} />
            </Route>
            
            {/* Artist routes */}
            <Route element={<RoleRoute role="artist" />}>
              <Route path="/artist-dashboard" element={<ArtistDashboard />} />
            </Route>
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;