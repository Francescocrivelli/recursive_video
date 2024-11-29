'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { assignUserRole } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

export default function RoleSelectionPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleRoleSelection = async (role: 'therapist' | 'patient') => {
    if (!user) return;
    
    setLoading(true);
    try {
      await assignUserRole(user.uid, role);
      router.push(role === 'therapist' ? '/therapist/select-therapy' : '/patient/dashboard');
    } catch (error) {
      console.error('Error assigning role:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Select Your Role</h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose your role to continue
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Button
            onClick={() => handleRoleSelection('therapist')}
            className="w-full"
            disabled={loading}
          >
            I am a Therapist
          </Button>
          
          <Button
            onClick={() => handleRoleSelection('patient')}
            className="w-full"
            variant="outline"
            disabled={loading}
          >
            I am a Patient
          </Button>
        </div>
      </div>
    </div>
  );
}