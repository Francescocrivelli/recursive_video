'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, getUserRole } from '@/lib/firebase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  userRole: string | null;
  isInitialized: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  isInitialized: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

// Add this at the top of your AuthProvider component
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    console.log('Auth state changed:', {
      user: currentUser?.email,
      timestamp: new Date().toISOString()
    });
    
    if (currentUser) {
      try {
        const role = await getUserRole(currentUser.uid);
        console.log('User role fetched:', {
          role,
          userId: currentUser.uid,
          timestamp: new Date().toISOString()
        });
        setUserRole(role);
      } catch (error) {
        console.error('Error fetching role:', error);
        setUserRole(null);
      }
    } else {
      console.log('No user found, clearing role');
      setUserRole(null);
    }
    
    setUser(currentUser);
    setLoading(false);
  });

  return () => unsubscribe();
}, []);




  useEffect(() => {
    console.log('AuthProvider mounted');
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser?.email);
      
      setUser(currentUser);
      
      if (currentUser) {
        try {
          console.log('Fetching user role for:', currentUser.uid);
          const role = await getUserRole(currentUser.uid);
          console.log('User role fetched:', role);
          setUserRole(role);
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
      setIsInitialized(true);
    });



    return () => {
      console.log('AuthProvider cleanup');
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    userRole,
    isInitialized
  };

  console.log('AuthProvider state:', value);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);