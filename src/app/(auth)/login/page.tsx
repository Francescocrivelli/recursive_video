'use client';

import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, googleProvider, getUserRole } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const role = await getUserRole(result.user.uid);
      
      if (role === 'therapist') {
        router.push('/therapist/select-therapy');
      } else if (role === 'patient') {
        router.push('/patient/dashboard');
      } else {
        // New user, needs role assignment
        router.push('/role-selection');
      }
    } catch (error) {
      setError('Failed to sign in with Google');
      console.error(error);
    }
  };

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
              {/* Google icon SVG path */}
            </svg>
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  );
}