"use client";

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';

interface Patient {
  id: string;
  name: string;
  lastSession: string;
  therapyType: string;
  status: string;
}

interface Session {
  date: string;
  sentiment: string;
  speakingTime: { [participant: string]: number };
  summary: string;
  therapyType: string;
  transcription: string;
  wordCloudData: string[];
}

export default function PatientDashboard() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;

      try {
        const docRef = doc(db, 'users', patientId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setPatient({
            id: docSnap.id,
            name: data.displayName || data.email || 'No name available',
            lastSession: data.lastSession || 'No previous session',
            therapyType: data.therapyType || 'N/A',
            status: data.status || 'Inactive',
          });
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    };

    const fetchSessions = async () => {
      if (!patientId) return;

      try {
        const sessionsCollection = collection(db, 'sessions');
        const q = query(sessionsCollection, where('patientId', '==', patientId));
        const sessionsSnapshot = await getDocs(q);

        const sessionsData: Session[] = sessionsSnapshot.docs.map(doc => doc.data() as Session);
        setSessions(sessionsData);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchPatientData();
    fetchSessions();
  }, [patientId]);

  if (!patient) {
    return <div>Loading patient data...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation showBack={true} showHome={true} onBack={() => router.back()} />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100">
          {patient.name}'s Dashboard
        </h1>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Therapy Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {patient.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {patient.lastSession}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {patient.therapyType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {patient.status}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Sessions</h2>
          <div className="overflow-y-auto max-h-96">
            {sessions.map((session, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p><strong>Date:</strong> {new Date(session.date).toLocaleString()}</p>
                <p><strong>Therapy Type:</strong> {session.therapyType}</p>
                <p><strong>Summary:</strong> {session.summary}</p>
                <p><strong>Sentiment:</strong> {session.sentiment}</p>
                <p><strong>Speaking Time:</strong> Patient: {session.speakingTime.Patient}%, Therapist: {session.speakingTime.Therapist}%</p>
                <p><strong>Transcription:</strong> {session.transcription}</p>
                <div>
                  <strong>Word Cloud:</strong>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {session.wordCloudData.map((word, i) => (
                      <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}