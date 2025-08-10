import BotConfigForm from '@/components/BotConfigForm';
import { CogIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ConfigPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Bot Configuration</h1>
            <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <BotConfigForm />
        </div>
      </main>
    </div>
  );
} 