import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../components/firebase/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
            // Attach role to user object for easier access
            user.role = userData.role;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserRole(null);
      }
      
      setCurrentUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const signup = async (email, password, role) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', user.uid), {
      email,
      role,
      createdAt: new Date(),
    });
    // Set role immediately after signup
    setUserRole(role);
    return user;
  };

  const login = async (email, password) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    // Role will be set by the onAuthStateChanged listener
    return user;
  };

  const getCurrentUser = () => {
    if (currentUser) {
      return {
        ...currentUser,
        role: userRole
      };
    }
    return null;
  };

  const value = { 
    currentUser, 
    userRole, 
    signup, 
    login,
    getCurrentUser,
    loading
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}