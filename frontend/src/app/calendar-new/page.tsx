import CalendarPro from '@/components/calendar/CalendarPro';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CalendarNewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <CalendarPro />
        </div>
      </main>
    </div>
  );
}
