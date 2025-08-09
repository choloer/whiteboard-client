import Whiteboard from '@/components/Whiteboard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Real-time Whiteboard
        </h1>
      </header>
      <main className="py-8">
        <Whiteboard />
      </main>
    </div>
  );
}
