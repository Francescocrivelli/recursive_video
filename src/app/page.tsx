'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold">Recursive Video</h1>
          <div className="space-x-4">
            <Button variant="ghost" onClick={() => router.push('/login')}>
              Login
            </Button>
            <Button onClick={() => router.push('/register')}>
              Get Started
            </Button>
          </div>
        </nav>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight">
              Transform Your Therapy Sessions with AI-Powered Insights
            </h2>
            <p className="text-xl text-gray-600">
              Record, transcribe, and analyze therapy sessions automatically. Get valuable insights and summaries to improve patient care.
            </p>
            <div className="space-x-4">
              <Button size="lg" onClick={() => router.push('/register')}>
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/about')}>
                Learn More
              </Button>
            </div>
          </div>
          
          <div className="relative h-[400px] bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
            {/* Placeholder for hero image/illustration */}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Recursive Video
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-white rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join therapists worldwide who are already using Recursive Video
          </p>
          <Button size="lg" onClick={() => router.push('/register')}>
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