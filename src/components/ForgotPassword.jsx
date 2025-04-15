import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      await sendPasswordResetEmail(auth, email);
      setMessage('Check your email for password reset instructions');
      setEmail('');
    } catch (err) {
      handleResetError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetError = (error) => {
    switch (error.code) {
      case 'auth/invalid-email':
        setError('Invalid email address');
        break;
      case 'auth/user-not-found':
        setError('No account found with this email');
        break;
      case 'auth/too-many-requests':
        setError('Too many attempts. Try again later');
        break;
      default:
        setError('Failed to send reset email. Please try again');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-lg p-8 shadow-xl border border-pink-900/30">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink-200 mb-2">Reset Password</h1>
          <p className="text-pink-300/70">Enter your email to receive reset instructions</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/30 text-red-300 rounded-lg text-sm border border-red-700/50">
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 bg-pink-900/30 text-pink-200 rounded-lg text-sm border border-pink-700/50">
            ✓ {message}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-pink-200 text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-pink-800/50 rounded-lg text-white placeholder-pink-200/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Enter your email"
            />
          </div>

          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </span>
            ) : (
              'Reset Password'
            )}
          </button>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-block text-sm text-pink-400 hover:text-pink-300 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}