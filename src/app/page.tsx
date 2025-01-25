"use client";

import { useState, useEffect } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Button } from "@/components/ui/button";

export default function TherapyPage() {
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState("");
  const [summary, setSummary] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // ------------------------------------------------------------------
  // 1) handleAudioReady (existing logic)
  // ------------------------------------------------------------------
  const handleAudioReady = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription failed");

      const data = await response.json();
      setTranscript(data.text);
    } catch (err) {
      setError("An error occurred during audio processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ------------------------------------------------------------------
  // 2) NEW: handleFileUpload
  // ------------------------------------------------------------------
  // Allows user to upload an audio file manually, then calls `handleAudioReady`.
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      await handleAudioReady(file);
    } catch (err) {
      console.error("File upload failed:", err);
      setError("Failed to process the audio file.");
    }
  };

  // ------------------------------------------------------------------
  // 3) handleRegister (Email Provider)
  // ------------------------------------------------------------------
  const handleRegister = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError("Email is required for registration.");
      return;
    }

    try {
      const response = await signIn("email", { email, redirect: false });
      if (!response?.error) {
        setMessage("Verification email sent. Please check your inbox.");
      } else {
        setError(response.error || "Registration failed.");
      }
    } catch (err) {
      setError("An error occurred during registration.");
    }
  };

  // ------------------------------------------------------------------
  // 4) handleLogin (Credentials or Email Provider)
  //    - Adjust if you're using CredentialsProvider for password flow
  // ------------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Example: sign in using "credentials" if your NextAuth includes a CredentialsProvider.
      // If you're still using EmailProvider for everything, adjust accordingly.
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Login failed. Please check your credentials.");
      } else {
        setMessage("Login successful!");
      }
    } catch (err) {
      setError("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // 5) handleLogout
  // ------------------------------------------------------------------
  const handleLogout = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await signOut({ redirect: false });
      setMessage("Logged out successfully.");
    } catch (err) {
      setError("An error occurred during logout.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // 6) verifyToken
  // ------------------------------------------------------------------
  const verifyToken = async (token: string) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || "Verification successful!");
        setIsVerified(true);
      } else {
        setError(data.error || "Verification failed.");
      }
    } catch (err) {
      setError("An error occurred during verification.");
    }
  };

  // ------------------------------------------------------------------
  // 7) useEffect - Check if there's a token in the URL
  // ------------------------------------------------------------------
  useEffect(() => {
    const token = searchParams.get("token");
    if (token && verificationToken === null) {
      setVerificationToken(token);
      verifyToken(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-8">
        <h1 className="text-4xl font-bold">Recursive Video</h1>
        <div className="flex gap-4 mt-4">
          <form onSubmit={handleLogin} className="flex flex-col">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="border p-2 rounded"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="border p-2 rounded"
            />
            {error && <p className="text-red-500">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className={`bg-blue-500 text-white rounded p-2 w-full ${loading ? "opacity-50" : ""}`}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <Button onClick={handleRegister} variant="outline">
            Register
          </Button>
        </div>
      </div>

      {message && <p className="text-green-600">{message}</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* ------------------------------------------------------------------
          Audio Recorder Section
         ------------------------------------------------------------------ */}
      <section className="mt-8 w-full max-w-xl">
        <h2 className="text-2xl mb-4">Audio Recorder</h2>
        <AudioRecorder
          onAudioReady={handleAudioReady}
          isProcessing={isProcessing} 
        />
        {isProcessing && <p className="text-gray-500">Processing audio...</p>}

        {transcript && (
          <div className="mt-4">
            <h3 className="font-bold">Transcript:</h3>
            <p>{transcript}</p>
          </div>
        )}
        {translation && (
          <div className="mt-4">
            <h3 className="font-bold">Translation:</h3>
            <p>{translation}</p>
          </div>
        )}
        {summary && (
          <div className="mt-4">
            <h3 className="font-bold">Summary:</h3>
            <p>{summary}</p>
          </div>
        )}

        {/* ------------------------------------------------------------------
          File Upload Input (Manually upload an audio file):
         ------------------------------------------------------------------ */}
        <div className="mt-4 mb-8">
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="border p-2"
          />
        </div>

      </section>
    </main>
  );
}
