'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define the Patient interface
interface Patient {
  id: string;
  name: string;
  lastSession: string;
  therapyType: string;
  status: string;
}
export default function TherapistSelectTherapy() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedTherapy, setSelectedTherapy] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('therapy');
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where('role', '==', 'patient'));
        const usersSnapshot = await getDocs(q);
  
        const usersData: Patient[] = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Raw patient data:', data);
          
          // Get email from the data
          const email = data.email;
          
          return {
            id: doc.id,
            name: data.displayName || email || 'No name available',
            lastSession: data.lastSession || 'No previous session',
            therapyType: data.therapyType || 'N/A',
            status: data.status || 'Inactive'
          };
        });
  
        console.log('Processed patients:', usersData);
        setPatients(usersData);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };
  
    fetchPatients();
  }, []);
  

  const therapyTypes = [
    {
      id: 'individual',
      title: 'Individual Therapy',
      description: 'One-on-one sessions with patients',
      icon: '👤',
      color: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      id: 'group',
      title: 'Group Therapy',
      description: 'Facilitate group therapy sessions',
      icon: '👥',
      color: 'bg-green-50 hover:bg-green-100'
    },
    {
      id: 'family',
      title: 'Family Therapy',
      description: 'Work with families and relationships',
      icon: '👨‍👩‍👧‍👦',
      color: 'bg-purple-50 hover:bg-purple-100'
    }
  ];

  const handleStartSession = () => {
    if (selectedTherapy && selectedPatient) {
      router.push(`/session?therapy=${selectedTherapy}&patient=${selectedPatient}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-200">
      <Navigation onBack={() => router.back()} />

      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Therapist Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.displayName || user?.email}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b">
            {['therapy', 'patients'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'therapy' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {therapyTypes.map((therapy) => (
                  <motion.div
                    key={therapy.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-6 rounded-xl cursor-pointer transition-all ${therapy.color} ${
                      selectedTherapy === therapy.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedTherapy(therapy.id);
                      setActiveTab('patients');
                    }}
                  >
                    <div className="text-4xl mb-4">{therapy.icon}</div>
                    <h3 className="text-lg font-semibold mb-2">{therapy.title}</h3>
                    <p className="text-gray-600 mb-4">{therapy.description}</p>
                    <Button
                      variant={selectedTherapy === therapy.id ? "default" : "outline"}
                      className="w-full"
                    >
                      {selectedTherapy === therapy.id ? 'Selected' : 'Select'}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'patients' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                    </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.length > 0 ? (
                      patients.map((patient) => (
                        <motion.tr
                          key={patient.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ backgroundColor: '#f9fafb' }}
                          className="transition-all"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{patient.name || "Unknown"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {patient.lastSession || "No previous session"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {patient.therapyType || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                patient.status === "Active"
                                  ? "bg-green-100 text-greenx-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {patient.status || "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/${patient.id}/dashboard`)}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedPatient(patient.id);
                                  setActiveTab("therapy");
                                }}
                              >
                                Start Session
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          No patients found.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>
            </motion.div>
          )}

          {selectedTherapy && selectedPatient && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 bg-blue-50 rounded-xl"
            >
              <h2 className="text-2xl font-bold mb-4">Session Summary</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-600">Selected Therapy</p>
                  <p className="font-medium">{therapyTypes.find(t => t.id === selectedTherapy)?.title}</p>
                </div>
                <div>
                  <p className="text-gray-600">Selected Patient</p>
                  <p className="font-medium">{patients.find(p => p.id === selectedPatient)?.name}</p>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                size="lg"
                onClick={handleStartSession}
                disabled={!selectedTherapy || !selectedPatient}
              >
                Start Session
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}