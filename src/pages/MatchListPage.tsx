import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Play, Trophy, Clock, Plus } from 'lucide-react'
import { useGetUmpireMatchesQuery } from '@/store/api'
import { useAuth } from '@/contexts/AuthContext'
import type { MatchWithDetails } from '../types'

const MatchListPage = () => {
  const navigate = useNavigate()
  const { leagueId } = useParams<{ leagueId: string }>()
  const { user } = useAuth()
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')

  // RTK Query hook - use umpire-specific matches for this league
  const { data: matches = [], isLoading: loading, error } = useGetUmpireMatchesQuery(
    { umpireId: user?.id || '', leagueId: leagueId || '' },
    { skip: !user?.id || !leagueId }
  )

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true
    return match.status === filter
  })

  // Get league name from first match
  const leagueName = matches.length > 0 ? matches[0].league_name : 'League'

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Upcoming'
      case 'in_progress':
        return 'Live'
      case 'completed':
        return 'Completed'
      default:
        return status
    }
  }

  const handleMatchClick = (matchId: string, status: string) => {
    if (status === 'completed') {
      return // Don't navigate to scoring for completed matches
    }
    navigate(`/league/${leagueId}/match/${matchId}/score`)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center p-6 border-b border-gray-800">
        <Link to={`/league/${leagueId}`} className="p-2 hover:bg-gray-800 rounded-lg mr-4">
          <ArrowLeft className="h-6 w-6 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-light">{leagueName}</h1>
          <p className="text-gray-400 text-sm">All Matches</p>
        </div>
      </div>

      <div className="p-6">
        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-900 p-1 rounded-lg">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Upcoming' },
            { key: 'in_progress', label: 'Live' },
            { key: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">Failed to load matches</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">Loading matches...</div>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No matches found</p>
            <Link
              to={`/league/${leagueId}/create-match`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Match
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => handleMatchClick(match.id, match.status)}
                className={`bg-gray-900 rounded-lg border border-gray-800 overflow-hidden ${
                  match.status !== 'completed' ? 'cursor-pointer hover:border-gray-700' : ''
                } transition-all`}
              >
                {/* Match Header */}
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(match.status)}`}>
                        {getStatusText(match.status)}
                      </span>
                      {match.is_trump_match && (
                        <span className="px-2 py-1 bg-yellow-900/20 border border-yellow-500 text-yellow-400 rounded-full text-xs font-medium">
                          Trump Match
                        </span>
                      )}
                    </div>
                    {match.status !== 'completed' && (
                      <Play className="h-4 w-4 text-gray-500" />
                    )}
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <Trophy className="h-4 w-4 mr-1" />
                    <span>{match.category_name}</span>
                    {match.court_number && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Court {match.court_number}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Team Information */}
                <div className="p-4">
                  <div className="space-y-3">
                    {/* Team 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="font-medium text-white">{match.team1_name}</div>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {match.team1_player1_name}
                          {match.team1_player1_dupr && (
                            <span className="ml-1 text-gray-500">({match.team1_player1_dupr})</span>
                          )}
                          {match.team1_player2_name && (
                            <>
                              {' & '}{match.team1_player2_name}
                              {match.team1_player2_dupr && (
                                <span className="ml-1 text-gray-500">({match.team1_player2_dupr})</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white ml-4">
                        {match.team1_score}
                      </div>
                    </div>

                    {/* VS Divider */}
                    <div className="text-center text-gray-500 text-sm font-medium">VS</div>

                    {/* Team 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="font-medium text-white">{match.team2_name}</div>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {match.team2_player1_name}
                          {match.team2_player1_dupr && (
                            <span className="ml-1 text-gray-500">({match.team2_player1_dupr})</span>
                          )}
                          {match.team2_player2_name && (
                            <>
                              {' & '}{match.team2_player2_name}
                              {match.team2_player2_dupr && (
                                <span className="ml-1 text-gray-500">({match.team2_player2_dupr})</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white ml-4">
                        {match.team2_score}
                      </div>
                    </div>
                  </div>

                  {/* Game Scores */}
                  {(match.team1_game1 !== undefined || match.team2_game1 !== undefined) && (
                    <div className="mt-4 pt-3 border-t border-gray-800">
                      <div className="text-sm text-gray-500 mb-2">Game Scores:</div>
                      <div className="flex space-x-4 text-sm">
                        {[1, 2, 3].map((gameNum) => {
                          const team1Score = match[`team1_game${gameNum}` as keyof MatchWithDetails] as number
                          const team2Score = match[`team2_game${gameNum}` as keyof MatchWithDetails] as number

                          if (team1Score === undefined && team2Score === undefined) return null

                          return (
                            <div key={gameNum} className="text-center">
                              <div className="text-gray-500">G{gameNum}</div>
                              <div className="font-medium text-white">
                                {team1Score ?? 0}-{team2Score ?? 0}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Match Time */}
                  {(match.start_time || match.completed_at || match.scheduled_time) && (
                    <div className="mt-3 flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {match.completed_at ? (
                        <span>Completed {new Date(match.completed_at).toLocaleDateString()}</span>
                      ) : match.start_time ? (
                        <span>Started {new Date(match.start_time).toLocaleDateString()}</span>
                      ) : match.scheduled_time ? (
                        <span>Scheduled {new Date(match.scheduled_time).toLocaleDateString()}</span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Action Button */}
        <Link
          to={`/league/${leagueId}/create-match`}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>
    </div>
  )
}

export default MatchListPage