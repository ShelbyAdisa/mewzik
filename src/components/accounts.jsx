import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase/firebaseConfig';
import { Music } from 'lucide-react';

export default function Signup() {
  const [role, setRole] = useState('listener');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [artistName, setArtistName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (role === 'artist' && !artistName) {
      setError('Artist/Band name is required');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore with appropriate fields
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: name,
        role: role,
        artistName: role === 'artist' ? artistName : null,
        createdAt: new Date().toISOString()
      });

      // Redirect based on role
      if (role === 'artist') {
        navigate('/artist-dashboard');
      } else {
        navigate('/listener-dashboard');
      }
    } catch (err) {
      handleSignupError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupError = (error) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        setError('Email already in use');
        break;
      case 'auth/invalid-email':
        setError('Invalid email address');
        break;
      case 'auth/weak-password':
        setError('Password is too weak');
        break;
      default:
        setError('Failed to create account. Please try again.');
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
        <header className="mb-8 flex items-center">
          <div className="mr-2 rounded-full bg-pink-600 p-2">
            <Music size={24} />
          </div>
          <h1 className="text-3xl font-bold">Harmony</h1>
        </header>

        {/* Auth Form Container */}
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-xl bg-black/40 p-8 backdrop-blur-md border border-gray-800">
            <h2 className="mb-6 text-center text-2xl font-bold">Create Your Account</h2>
            
            {error && (
              <div className="mb-6 p-3 bg-pink-900/50 text-pink-300 rounded-lg text-sm">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              {/* User Type Selection */}
              <div className="mb-6 flex rounded-xl bg-gray-800/50">
                <button
                  className={`w-1/2 rounded-xl py-3 text-center transition-all ${role === 'listener' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setRole('listener')}
                  type="button"
                >
                  Listener
                </button>
                <button
                  className={`w-1/2 rounded-xl py-3 text-center transition-all ${role === 'artist' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setRole('artist')}
                  type="button"
                >
                  Artist
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-pink-500 focus:outline-none"
                  placeholder="Enter your name"
                />
              </div>
              
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
                  placeholder="Create a password (min. 6 characters)"
                />
              </div>

              {role === 'artist' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Artist/Band Name <span className="text-pink-500">*</span></label>
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    required={role === 'artist'}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white focus:border-pink-500 focus:outline-none"
                    placeholder="Enter your artist/band name"
                  />
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-pink-600 py-3 text-center font-semibold text-white transition-all hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="flex items-center justify-center pt-2">
                <span className="text-sm text-gray-400">
                  Already have an account?{' '}
                  <Link to="/login" className="text-pink-400 hover:underline">
                    Log In
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Feature Highlight */}
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-300 max-w-md">
            Join millions of music lovers and artists on Harmony - your new home for music discovery.
          </p>
        </div>
      </div>
    </div>
  );
}