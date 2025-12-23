import { useNavigate } from 'react-router-dom'
import { LogOut, Trophy, Calendar, MapPin } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGetUmpireAssignedLeaguesQuery } from '@/store/api'

const LeagueSelectionPage = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const { data: leagues = [], isLoading: loading, error } = useGetUmpireAssignedLeaguesQuery(user?.id || '', {
    skip: !user?.id,
  })

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-900/20 border-blue-500 text-blue-400'
      case 'ongoing':
        return 'bg-green-900/20 border-green-500 text-green-400'
      case 'completed':
        return 'bg-gray-900/20 border-gray-500 text-gray-400'
      default:
        return 'bg-gray-900/20 border-gray-500 text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div>
          <h1 className="text-2xl font-light">Welcome, {user?.name}</h1>
          <p className="text-gray-400 text-sm">Select a league to manage</p>
        </div>
        <button
          onClick={handleSignOut}
          className="p-3 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-400">Loading assigned leagues...</div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg mb-6">
            <p className="text-red-400">Failed to load leagues</p>
          </div>
        )}

        {!loading && leagues.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-gray-300 mb-2">No Leagues Assigned</h3>
            <p className="text-gray-500">
              You haven't been assigned to any leagues yet.
            </p>
            <p className="text-gray-500 mt-2">
              Contact your administrator for access.
            </p>
          </div>
        )}

        {!loading && leagues.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg text-gray-300 mb-6">Your Assigned Leagues</h2>
            {leagues.map((league) => (
              <div
                key={league.id}
                onClick={() => navigate(`/league/${league.id}`)}
                className="p-6 bg-gray-900 border border-gray-800 rounded-lg cursor-pointer hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-medium text-white mb-2">
                      {league.name}
                    </h3>
                    {league.description && (
                      <p className="text-gray-400 text-sm mb-4">
                        {league.description}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(league.status)}`}>
                    {league.status === 'upcoming' ? 'Upcoming' :
                     league.status === 'ongoing' ? 'Live' :
                     league.status === 'completed' ? 'Completed' :
                     league.status}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(league.start_date)} - {formatDate(league.end_date)}
                    </span>
                  </div>
                  {league.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{league.location}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="text-xs text-gray-500">
                    Assigned on {new Date(league.assigned_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LeagueSelectionPage