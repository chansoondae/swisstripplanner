'use client';

// context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, signInWithGoogle, signOutUser } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const login = async () => {
    const result = await signInWithGoogle();
    return result;
  };

  // Sign out
  const logout = async () => {
    const result = await signOutUser();
    return result;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};