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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400">Enter your email to receive reset instructions</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 bg-green-900/50 text-green-300 rounded-lg text-sm">
            ✓ {message}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="inline-block text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}