import Link from 'next/link';
import {
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  CogIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

export default function MobileDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">WhatsApp Bot</h1>
        <Link
          href="/"
          className="text-primary-600 text-sm font-medium"
        >
          Desktop View
        </Link>
      </header>

      <main className="flex-1 p-4 space-y-4">
        <Link
          href="/test-chat"
          className="block p-4 bg-white rounded-lg shadow text-center font-medium text-gray-900"
        >
          Test Chat
        </Link>
        <Link
          href="/config"
          className="block p-4 bg-white rounded-lg shadow text-center font-medium text-gray-900"
        >
          Configuration
        </Link>
        <Link
          href="/calendar"
          className="block p-4 bg-white rounded-lg shadow text-center font-medium text-gray-900"
        >
          Calendar
        </Link>
      </main>

      <nav className="bg-white border-t p-2 flex justify-around">
        <Link href="/mobile" className="flex flex-col items-center text-primary-600">
          <HomeIcon className="h-6 w-6" />
          <span className="text-xs">Home</span>
        </Link>
        <Link href="/test-chat" className="flex flex-col items-center text-gray-600">
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
          <span className="text-xs">Chat</span>
        </Link>
        <Link href="/calendar" className="flex flex-col items-center text-gray-600">
          <CalendarDaysIcon className="h-6 w-6" />
          <span className="text-xs">Calendar</span>
        </Link>
        <Link href="/config" className="flex flex-col items-center text-gray-600">
          <CogIcon className="h-6 w-6" />
          <span className="text-xs">Config</span>
        </Link>
      </nav>
    </div>
  );
}
