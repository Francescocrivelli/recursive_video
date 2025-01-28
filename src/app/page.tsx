'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, isInitialized } = useAuth();

  // useEffect(() => {
  //   if (isInitialized && user && userRole) {
  //     // Redirect only if the user is not on the landing page
  //     if (pathname === '/') return;

  //     if (userRole === 'therapist' && pathname !== '/select-therapy') {
  //       router.push('/select-therapy');
  //     } else if (userRole === 'patient' && pathname !== '/dashboard') {
  //       router.push('/dashboard');
  //     }
  //   }
  // }, [user, userRole, isInitialized, router, pathname]);

  // If still loading auth state, show nothing to prevent flash
  if (!isInitialized) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-600 dark:from-purple-300 dark:to-blue-400">
            Recursive Video
          </h1>
          <div className="space-x-4">
            <Button variant="ghost" onClick={() => router.push('/login')} 
              className="dark:text-gray-100 dark:hover:bg-gray-700">
              Login
            </Button>
            <Button onClick={() => router.push('/register')}
              className="dark:bg-blue-600 dark:hover:bg-blue-700">
              Get Started
            </Button>
            {user && userRole && (
              <Button onClick={() => router.push(userRole === 'therapist' ? '/select-therapy' : '/dashboard')}
                className="dark:bg-blue-600 dark:hover:bg-blue-700">
                Go to Dashboard
              </Button>
            )}
          </div>
        </nav>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight text-gray-800 dark:text-gray-100">
              Transform Your Therapy Sessions with AI-Powered Insights
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300">
              Record, transcribe, and analyze therapy sessions automatically. Get valuable insights and summaries to improve patient care.
            </p>
            <div className="space-x-4">
              <Button size="lg" onClick={() => router.push('/register')}
                className="dark:bg-blue-600 dark:hover:bg-blue-700">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/about')}
                className="dark:text-gray-100 dark:hover:bg-gray-700 dark:border-gray-400">
                Learn More
              </Button>
            </div>
          </div>
          
          <div className="relative h-[400px] bg-gradient-to-r from-purple-200 to-blue-200 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-lg">
            {/* Placeholder for hero image/illustration */}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-900 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-100">
            Why Choose Recursive Video
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            Join therapists worldwide who are already using Recursive Video
          </p>
          <Button size="lg" onClick={() => router.push('/register')}
            className="dark:bg-blue-600 dark:hover:bg-blue-700">
            Get Started Now
          </Button>
        </div>
      </section>
    </main>
  );
}

const features = [
  {
    title: "AI-Powered Transcription",
    description: "Automatically convert therapy sessions into accurate text transcripts in real-time."
  },
  {
    title: "Smart Summaries",
    description: "Get AI-generated session summaries highlighting key insights and action items."
  },
  {
    title: "Secure & Compliant",
    description: "Enterprise-grade security and HIPAA compliance to protect sensitive patient data."
  }
];