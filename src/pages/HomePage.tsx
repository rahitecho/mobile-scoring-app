import { Link } from 'react-router-dom'
import { Plus, List, Trophy } from 'lucide-react'

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mobile Scoring</h1>
        <p className="text-gray-600">Match Creation & Scoring App</p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4 max-w-md mx-auto">
        <Link
          to="/create-match"
          className="flex items-center w-full p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mr-4">
            <Plus className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Create Match</h3>
            <p className="text-sm text-gray-500">Set up a new match with teams</p>
          </div>
        </Link>

        <Link
          to="/matches"
          className="flex items-center w-full p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
            <List className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Match List</h3>
            <p className="text-sm text-gray-500">View and score ongoing matches</p>
          </div>
        </Link>

        <div className="flex items-center w-full p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mr-4">
            <Trophy className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">League Manager</h3>
            <p className="text-sm text-gray-500">Manage league matches and standings</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-12 max-w-md mx-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-primary-600">0</div>
            <div className="text-sm text-gray-500">Active Matches</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-500">Total Points</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage