'use client';

import { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, googleProvider, getUserRole } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';




export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (user && userRole) {
      // User is authenticated and has a role
      if (userRole === 'therapist') {
        router.push('/select-therapy');
      } else if (userRole === 'patient') {
        router.push('/dashboard');
      }
    } else if (user && !userRole) {
      // User is authenticated but needs to select a role
      router.push('/role-selection');
    } else {
      // Not authenticated, show login page
      setIsLoading(false);
    }
  }, [user, userRole, router]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const role = await getUserRole(result.user.uid);
      
      document.cookie = `session=${role}; path=/`; // Example of setting a session cookie

      if (role) {
        // User has a role, redirect accordingly
        if (role === 'therapist') {
          router.push('/select-therapy');
        } else {
          router.push('/dashboard');
        }
      } else {
        // New user, needs role assignment
        router.push('/role-selection');
      }
    } catch (error) {
      setError('Failed to sign in with Google');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your account
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
              />
            </svg>
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
