import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Recursive Video</h1>
        <div className="flex gap-4">
          <Button variant="default">Login</Button>
          <Button variant="outline">Register</Button>
        </div>
      </div>
    </main>
  )
}
