'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

interface Patient {
  uid: string;
  name: string;
  email: string;
  therapyTypes: string[];
}

const THERAPY_TYPES = [
  'Speech Therapy',
  'Psychology',
  'Occupational Therapy',
  'Kinesiology'
];

export default function SelectTherapyPage() {
  const [selectedTherapy, setSelectedTherapy] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const patientsSnapshot = await getDocs(collection(db, 'patients'));
        const patientsData = patientsSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as Patient));
        setPatients(patientsData);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleContinue = () => {
    if (selectedTherapy && selectedPatient) {
      router.push(`/therapist/session?therapy=${selectedTherapy}&patient=${selectedPatient}`);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Select Therapy Type</h2>
          <div className="grid grid-cols-2 gap-4">
            {THERAPY_TYPES.map(therapy => (
              <Button
                key={therapy}
                onClick={() => setSelectedTherapy(therapy)}
                variant={selectedTherapy === therapy ? "default" : "outline"}
                className="h-24 text-lg"
              >
                {therapy}
              </Button>
            ))}
          </div>
        </div>

        {selectedTherapy && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Select Patient</h2>
            <div className="grid grid-cols-2 gap-4">
              {patients.map(patient => (
                <Button
                  key={patient.uid}
                  onClick={() => setSelectedPatient(patient.uid)}
                  variant={selectedPatient === patient.uid ? "default" : "outline"}
                  className="h-16"
                >
                  {patient.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {selectedTherapy && selectedPatient && (
          <Button
            onClick={handleContinue}
            className="w-full mt-8"
          >
            Continue to Session
          </Button>
        )}
      </div>
    </div>
  );
}