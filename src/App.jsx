

// import { useState } from "react";
// import LandingPage from "./LandingPage/Home";
// import PinkMusic from "./Users/ListenerDashboard";
// import ArtistDashboard from "./Users/ArtistDashboard";
// import { db } from

// import { 
//   collection, 
//   addDoc, 
//   updateDoc, 
//   deleteDoc, 
//   doc, 
//   getDocs, 
//   query, 
//   orderBy 
// } from 'firebase/firestore';

// export default function App() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [userType, setUserType] = useState("listener"); 
  
//   // Function to handle successful login
//   const handleLogin = (type) => {
//     setUserType(type);
//     setIsLoggedIn(true);
//   };
  
//   // Function to handle logout
//   const handleLogout = () => {
//     setIsLoggedIn(false);
//   };
  
//   // Render the appropriate component based on login state
//   if (!isLoggedIn) {
//     return <LandingPage onLogin={handleLogin} />;
//   }
  
//   // Show either listener or artist dashboard based on user type
//   return userType === "listener" ? (
//     <PinkMusic onLogout={handleLogout} />
//   ) : (
//     <ArtistDashboard onLogout={handleLogout} />
//   );
// }

// 


import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './Contexts/AuthContext';
import Landing from './components/LandingPage/Home';
import Login from './components/accounts';
import ListenerDashboard from './components/Users/ListenerDashboard';
import ArtistDashboard from './components/Users/ArtistDashboard';
import Player from './components/Player';
import {AuthProvider} from './Contexts/AuthProvider';

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
          <Route path="/signup/listener" element={<Signup role="listener" />} />
          <Route path="/signup/artist" element={<Signup role="artist" />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
            <Route element={<RoleRoute role="listener" />}>
              <Route path="/dashboard" element={<ListenerDashboard />} />
            </Route>
            
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

// Temporary Signup component (you should create a proper one)
const Signup = ({ role }) => {
  const { signup } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    await signup(email, password, role);
  };

  return (
    <div className="min-h-screen bg-pink-900 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-black p-8 rounded-xl space-y-4">
        <h2 className="text-2xl text-pink-400">Sign up as {role}</h2>
        <input 
          type="email" 
          name="email" 
          placeholder="Email" 
          className="w-full p-2 rounded bg-pink-900 text-white"
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          className="w-full p-2 rounded bg-pink-900 text-white"
        />
        <button 
          type="submit"
          className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default App;