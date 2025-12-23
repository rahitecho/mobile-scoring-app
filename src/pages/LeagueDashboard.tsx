import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, List, Trophy, Clock, Users } from 'lucide-react'
import { useGetUmpireMatchesQuery } from '@/store/api'
import { useAuth } from '@/contexts/AuthContext'

const LeagueDashboard = () => {
  const { leagueId } = useParams<{ leagueId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: matches = [], isLoading: loadingMatches } = useGetUmpireMatchesQuery(
    { umpireId: user?.id || '', leagueId: leagueId || '' },
    { skip: !user?.id || !leagueId }
  )

  // Get league name from first match (since all matches belong to same league)
  const leagueName = matches.length > 0 ? matches[0].league_name : 'League'

  // Calculate stats
  const totalMatches = matches.length
  const completedMatches = matches.filter(m => m.status === 'completed').length
  const upcomingMatches = matches.filter(m => m.status === 'pending').length
  const inProgressMatches = matches.filter(m => m.status === 'in_progress').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900/20 border-yellow-500 text-yellow-400'
      case 'in_progress':
        return 'bg-green-900/20 border-green-500 text-green-400'
      case 'completed':
        return 'bg-blue-900/20 border-blue-500 text-blue-400'
      default:
        return 'bg-gray-900/20 border-gray-500 text-gray-400'
    }
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center p-6 border-b border-gray-800">
        <Link to="/" className="p-2 hover:bg-gray-800 rounded-lg mr-4">
          <ArrowLeft className="h-6 w-6 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-light">{leagueName}</h1>
          <p className="text-gray-400 text-sm">League Dashboard</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900/20 border border-blue-500 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-medium">{totalMatches}</p>
                <p className="text-sm text-gray-400">Total Matches</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-900/20 border border-green-500 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-medium">{upcomingMatches}</p>
                <p className="text-sm text-gray-400">Upcoming</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-900/20 border border-yellow-500 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-medium">{inProgressMatches}</p>
                <p className="text-sm text-gray-400">In Progress</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-900/20 border border-purple-500 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-medium">{completedMatches}</p>
                <p className="text-sm text-gray-400">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg text-gray-300 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to={`/league/${leagueId}/create-match`}
              className="p-6 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Plus className="h-6 w-6" />
                <div>
                  <p className="font-medium">Create Match</p>
                  <p className="text-sm text-blue-100">Schedule new match</p>
                </div>
              </div>
            </Link>

            <Link
              to={`/league/${leagueId}/matches`}
              className="p-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <List className="h-6 w-6" />
                <div>
                  <p className="font-medium">All Matches</p>
                  <p className="text-sm text-gray-400">View & manage</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Matches */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-gray-300">Recent Matches</h2>
            <Link
              to={`/league/${leagueId}/matches`}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View All
            </Link>
          </div>

          {loadingMatches && (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading matches...</p>
            </div>
          )}

          {!loadingMatches && matches.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">No matches yet</p>
              <Link
                to={`/league/${leagueId}/create-match`}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Create your first match
              </Link>
            </div>
          )}

          {!loadingMatches && matches.length > 0 && (
            <div className="space-y-3">
              {matches.slice(0, 5).map((match) => (
                <div
                  key={match.id}
                  onClick={() => {
                    if (match.status !== 'completed') {
                      navigate(`/league/${leagueId}/match/${match.id}/score`)
                    }
                  }}
                  className={`p-4 bg-gray-900 border border-gray-800 rounded-lg ${
                    match.status !== 'completed' ? 'cursor-pointer hover:border-gray-700' : ''
                  } transition-colors`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(match.status)}`}>
                      {match.status === 'pending' ? 'Upcoming' :
                       match.status === 'in_progress' ? 'Live' :
                       'Completed'}
                    </span>
                    {match.court_number && (
                      <span className="text-xs text-gray-500">Court {match.court_number}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">
                        {match.team1_name} vs {match.team2_name}
                      </p>
                      <p className="text-xs text-gray-400">{match.category_name}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-medium">
                        {match.team1_score} - {match.team2_score}
                      </p>
                      {match.scheduled_time && (
                        <p className="text-xs text-gray-500">
                          {formatTime(match.scheduled_time)}
                        </p>
                      )}
                    </div>
                  </div>

                  {match.is_trump_match && (
                    <div className="mt-2">
                      <span className="px-2 py-1 bg-yellow-900/20 border border-yellow-500 text-yellow-400 rounded text-xs">
                        Trump Match
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeagueDashboard