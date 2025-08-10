import Link from 'next/link';
import { 
  ChatBubbleLeftRightIcon, 
  CalendarDaysIcon, 
  CogIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp Bot Manager</h1>
            </div>
            <nav className="flex space-x-4">
              <Link 
                href="/config" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Configuration
              </Link>
              <Link 
                href="/calendar" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Calendar
              </Link>
              <Link 
                href="/test-chat" 
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
              >
                Test Chat
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to WhatsApp Bot Manager
              </h2>
              <p className="text-gray-600 mb-4">
                Configure your AI chatbot, manage appointments, and test your bot before connecting to WhatsApp.
              </p>
              <div className="flex space-x-3">
                <Link
                  href="/config"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  <CogIcon className="h-4 w-4 mr-2" />
                  Configure Bot
                </Link>
                <Link
                  href="/test-chat"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                  Test Chat
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Today's Appointments
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">5</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        This Week
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">23</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Bot Status
                      </dt>
                      <dd className="text-lg font-medium text-success-600">Active</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CogIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Available Slots
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">12</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <CogIcon className="h-6 w-6 text-primary-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Bot Configuration</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Set up your AI assistant's personality, system prompts, and behavior settings.
                </p>
                <Link
                  href="/config"
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Configure now →
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <CalendarDaysIcon className="h-6 w-6 text-primary-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Calendar Management</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Manage your availability, view appointments, and set up your schedule.
                </p>
                <Link
                  href="/calendar"
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  View calendar →
                </Link>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Test Your Bot</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Chat with your AI assistant to test its responses and appointment booking.
                </p>
                <Link
                  href="/test-chat"
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Start testing →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 