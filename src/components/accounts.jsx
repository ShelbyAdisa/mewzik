import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import { auth } from '../firebase/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

const accounts = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    try {
      setError('');
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate(currentUser?.role === 'artist' ? '/artist-dashboard' : '/dashboard');
    } catch (err) {
      handleLoginError(err);
      setLoading(false);
    }
  };

  const handleLoginError = (error) => {
    switch (error.code) {
      case 'auth/invalid-email':
        setError('Invalid email address');
        break;
      case 'auth/user-disabled':
        setError('Account disabled');
        break;
      case 'auth/user-not-found':
        setError('No account found with this email');
        break;
      case 'auth/wrong-password':
        setError('Incorrect password');
        break;
      default:
        setError('Failed to log in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-pink-900/10 backdrop-blur-lg rounded-2xl p-8 border border-pink-900/50 shadow-xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-pink-400 mb-2">Pink Music</h1>
          <p className="text-pink-200/80">Login to continue</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-pink-900/50 text-pink-300 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-pink-300/80 text-sm mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-pink-900/20 border border-pink-900/50 rounded-lg text-pink-100 placeholder-pink-500/70 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-pink-300/80 text-sm mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-pink-900/20 border border-pink-900/50 rounded-lg text-pink-100 placeholder-pink-500/70 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <Link
            to="/forgot-password"
            className="inline-block text-sm text-pink-400/80 hover:text-pink-300 transition-colors"
          >
            Forgot your password?
          </Link>
          
          <div className="text-pink-400/80 text-sm">
            Don't have an account?{' '}
            <div className="flex justify-center space-x-3 mt-2">
              <Link
                to="/signup/listener"
                className="text-pink-300 hover:text-pink-200 underline"
              >
                Listener
              </Link>
              <span className="text-pink-500">|</span>
              <Link
                to="/signup/artist"
                className="text-pink-300 hover:text-pink-200 underline"
              >
                Artist
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default accounts;