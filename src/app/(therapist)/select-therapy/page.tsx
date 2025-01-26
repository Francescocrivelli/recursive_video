'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Navigation } from '@/components/Navigation';

export default function TherapistSelectTherapy() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedTherapy, setSelectedTherapy] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');

  const handleStartSession = () => {
    if (selectedTherapy && selectedPatient) {
      router.push(`/session?therapy=${selectedTherapy}&patient=${selectedPatient}`);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <Navigation />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Select Therapy Type</h1>
        <p className="mb-4">Welcome, {user?.email}</p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder therapy type options */}
          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Individual Therapy</h3>
            <p className="text-gray-600 mb-4">One-on-one sessions with patients</p>
            <Button onClick={() => setSelectedTherapy('individual')}>
              Select
            </Button>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Group Therapy</h3>
            <p className="text-gray-600 mb-4">Facilitate group therapy sessions</p>
            <Button onClick={() => setSelectedTherapy('group')}>
              Select
            </Button>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Family Therapy</h3>
            <p className="text-gray-600 mb-4">Work with families and relationships</p>
            <Button onClick={() => setSelectedTherapy('family')}>
              Select
            </Button>
          </div>
        </div>
        
        <div className="mt-8">
          <Button 
            onClick={() => router.push('/patient/dashboard')}
            className="w-full"
            variant="outline"
          >
            View All Patients
          </Button>
        </div>

        {selectedTherapy && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Select Patient</h2>
            {/* Placeholder patient selection */}
            <select 
              className="w-full p-2 border rounded"
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
            >
              <option value="">Select a patient</option>
              <option value="1">John Doe</option>
              <option value="2">Jane Smith</option>
            </select>
            
            <Button 
              className="mt-4"
              onClick={handleStartSession}
              disabled={!selectedPatient}
            >
              Start Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}