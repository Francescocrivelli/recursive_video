'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { assignUserRole } from '@/lib/firebase';

export default function RoleSelectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const handleRoleSelection = async (role: 'therapist' | 'patient') => {
    if (!user) {
      setError('No user found. Please sign in again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await assignUserRole(user.uid, role);

      // Redirect user based on role
      if (role === 'therapist') {
        router.push('/select-therapy');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error assigning role:', err);
      setError('Failed to set user role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-blue-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-800">Select Your Role</h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose your role to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-6">
          <Button
            onClick={() => handleRoleSelection('therapist')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'I am a Therapist'
            )}
          </Button>

          <Button
            onClick={() => handleRoleSelection('patient')}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'I am a Patient'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
