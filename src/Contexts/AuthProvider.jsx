import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase/firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setUserRole(userDoc.data()?.role || 'listener');
        setCurrentUser({ ...user, ...userDoc.data() });
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Sign up with role
  const signup = async (email, password, role, additionalData) => {
    try {
      setError('');
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        email,
        role,
        createdAt: new Date(),
        ...additionalData
      });

      // Create role-specific collection
      if (role === 'artist') {
        await setDoc(doc(db, 'artists', user.uid), {
          totalListeners: 0,
          tracks: []
        });
      } else {
        await setDoc(doc(db, 'listeners', user.uid), {
          playtime: 0,
          favorites: [],
          playlists: []
        });
      }

      return user;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return user;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Password reset
  const resetPassword = async (email) => {
    try {
      setError('');
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (data, file) => {
    try {
      setLoading(true);
      let photoURL = currentUser.photoURL;
      
      if (file) {
        const storageRef = ref(storage, `avatars/${currentUser.uid}`);
        await uploadBytes(storageRef, file);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...data,
        ...(photoURL && { photoURL })
      });

      setCurrentUser(prev => ({
        ...prev,
        ...data,
        ...(photoURL && { photoURL })
      }));
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Error handling
  const handleError = (error) => {
    const errorMap = {
      'auth/email-already-in-use': 'Email already in use',
      'auth/invalid-email': 'Invalid email address',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/weak-password': 'Password is too weak',
      'auth/user-disabled': 'Account disabled',
      'auth/user-not-found': 'Account not found',
      'auth/wrong-password': 'Incorrect password',
    };
    setError(errorMap[error.code] || 'Authentication error');
  };

  const value = {
    currentUser,
    userRole,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}