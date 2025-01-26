'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Navigation } from '@/components/Navigation';


interface Session {
  id: string;
  date: string;
  therapyType: string;
  summary: string;
}

export default function PatientDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;

      try {
        let sessionsQuery;
        
        if (userRole === 'therapist') {
          // Fetch all sessions for therapists
          sessionsQuery = query(
            collection(db, 'sessions')
          );
        } else {
          // Fetch only patient's sessions
          sessionsQuery = query(
            collection(db, 'sessions'),
            where('patientId', '==', user.uid)
          );
        }
        
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const sessionsData = sessionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Session));

        // Sort sessions by date
        sessionsData.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setSessions(sessionsData);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          {userRole === 'therapist' ? 'All Patient Sessions' : 'Your Therapy Sessions'}
        </h1>

        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No sessions found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sessions.map(session => (
              <div
                key={session.id}
                className="bg-white shadow rounded-lg p-6 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{session.therapyType}</h2>
                    <p className="text-gray-600">
                      {new Date(session.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <h3 className="text-lg font-medium">Session Summary</h3>
                  <p className="text-gray-700">{session.summary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}