import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';
import { Music } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase/firebaseConfig';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Sign in user with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user data from Firestore to get role
      const userDocRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        
        // Check user role and redirect accordingly
        if (userData.role === 'artist') {
          navigate('/artist-dashboard');
        } else {
          navigate('/listener-dashboard');
        }
      } else {
        // If user exists in auth but not in Firestore database
        // We could either create a default user document or show an error
        setError('User profile not found. Please contact support.');
      }
      
    } catch (err) {
      handleLoginError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginError = (error) => {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        setError('Invalid email or password');
        break;
      case 'auth/invalid-email':
        setError('Invalid email address');
        break;
      case 'auth/too-many-requests':
        setError('Too many failed login attempts. Please try again later');
        break;
      default:
        setError('Failed to sign in. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Background gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-black to-purple-900 opacity-80"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Logo Header */}
        <header className="mb-4 flex items-center">
          <div className="mr-2 rounded-full bg-pink-600 p-2">
            <Music size={24} />
          </div>
          <h1 className="text-3xl font-bold">Harmony</h1>
        </header>

        {/* Feature Highlight - Moved to the top */}
        <div className="mb-8 text-center">
          <p className="text-lg text-gray-300 max-w-md">
            Welcome back to Harmony - where music connects us all.
          </p>
        </div>

        {/* Auth Form Container */}
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-xl bg-black/40 p-8 backdrop-blur-md border border-gray-800">
            <h2 className="mb-6 text-center text-2xl font-bold">Welcome Back</h2>
            
            {error && (
              <div className="mb-6 p-3 bg-pink-900/50 text-pink-300 rounded-lg text-sm">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Email <span className="text-pink-500">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-pink-500 focus:outline-none"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Password <span className="text-pink-500">*</span></label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-pink-500 focus:outline-none"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-pink-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-pink-600 py-3 text-center font-semibold text-white transition-all hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="flex items-center justify-center pt-2">
                <span className="text-sm text-gray-400">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-pink-400 hover:underline">
                    Sign Up
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}