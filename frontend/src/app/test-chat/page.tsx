'use client';

import Link from 'next/link';
import TestChat from '@/components/chat/TestChat';

export default function TestChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Test Chat</h1>
            <Link href="/" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <TestChat />
        </div>
      </main>
    </div>
  );
} 