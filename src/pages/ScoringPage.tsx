import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Pause, Save, Trophy, Users } from 'lucide-react'
import { useGetMatchQuery, useUpdateMatchMutation } from '@/store/api'
import type { MatchWithDetails, UpdateMatchScoreRequest } from '../types'

const ScoringPage = () => {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()

  // RTK Query hooks
  const { data: match, isLoading: loading, error } = useGetMatchQuery(matchId || '', {
    skip: !matchId,
  })
  const [updateMatch, { isLoading: saving }] = useUpdateMatchMutation()

  // Score state
  const [team1Score, setTeam1Score] = useState(0)
  const [team2Score, setTeam2Score] = useState(0)
  const [team1Game1, setTeam1Game1] = useState<number>(0)
  const [team1Game2, setTeam1Game2] = useState<number>(0)
  const [team1Game3, setTeam1Game3] = useState<number>(0)
  const [team2Game1, setTeam2Game1] = useState<number>(0)
  const [team2Game2, setTeam2Game2] = useState<number>(0)
  const [team2Game3, setTeam2Game3] = useState<number>(0)

  const [currentGame, setCurrentGame] = useState(1)
  const [matchStatus, setMatchStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending')

  // Initialize scores when match data is loaded
  useEffect(() => {
    if (match) {
      setMatchStatus(match.status)
      setTeam1Score(match.team1_score || 0)
      setTeam2Score(match.team2_score || 0)
      setTeam1Game1(match.team1_game1 || 0)
      setTeam1Game2(match.team1_game2 || 0)
      setTeam1Game3(match.team1_game3 || 0)
      setTeam2Game1(match.team2_game1 || 0)
      setTeam2Game2(match.team2_game2 || 0)
      setTeam2Game3(match.team2_game3 || 0)

      // Determine current game based on completed games
      if (match.team1_game3 !== undefined || match.team2_game3 !== undefined) {
        setCurrentGame(3)
      } else if (match.team1_game2 !== undefined || match.team2_game2 !== undefined) {
        setCurrentGame(2)
      } else {
        setCurrentGame(1)
      }
    }
  }, [match])

  const startMatch = async () => {
    if (!match) return

    try {
      const updateData: UpdateMatchScoreRequest = {
        id: match.id,
        status: 'in_progress',
      }

      await updateMatch(updateData).unwrap()
      setMatchStatus('in_progress')
    } catch (err) {
      console.error('Failed to start match:', err)
    }
  }

  const updateGameScore = (team: 'team1' | 'team2', game: number, score: number) => {
    if (game === 1) {
      if (team === 'team1') setTeam1Game1(score)
      else setTeam2Game1(score)
    } else if (game === 2) {
      if (team === 'team1') setTeam1Game2(score)
      else setTeam2Game2(score)
    } else if (game === 3) {
      if (team === 'team1') setTeam1Game3(score)
      else setTeam2Game3(score)
    }
  }

  const calculateSetScores = () => {
    let team1Sets = 0
    let team2Sets = 0

    // Game 1
    if (team1Game1 > team2Game1) team1Sets++
    else if (team2Game1 > team1Game1) team2Sets++

    // Game 2
    if (team1Game2 > team2Game2) team1Sets++
    else if (team2Game2 > team1Game2) team2Sets++

    // Game 3
    if (team1Game3 > team2Game3) team1Sets++
    else if (team2Game3 > team1Game3) team2Sets++

    setTeam1Score(team1Sets)
    setTeam2Score(team2Sets)

    return { team1Sets, team2Sets }
  }

  const saveMatch = async () => {
    if (!match) return

    try {
      const { team1Sets, team2Sets } = calculateSetScores()

      // Determine if match is completed (best of 3 games, first to win 2 games wins)
      const isCompleted = team1Sets >= 2 || team2Sets >= 2

      const updateData: UpdateMatchScoreRequest = {
        id: match.id,
        status: isCompleted ? 'completed' : 'in_progress',
        team1_score: team1Sets,
        team2_score: team2Sets,
        team1_game1: team1Game1 || undefined,
        team1_game2: team1Game2 || undefined,
        team1_game3: team1Game3 || undefined,
        team2_game1: team2Game1 || undefined,
        team2_game2: team2Game2 || undefined,
        team2_game3: team2Game3 || undefined,
        completed_at: isCompleted ? new Date().toISOString() : undefined,
      }

      await updateMatch(updateData).unwrap()

      if (isCompleted) {
        setMatchStatus('completed')
        setTimeout(() => {
          navigate('/matches')
        }, 2000)
      } else {
        setMatchStatus('in_progress')
      }
    } catch (err) {
      console.error('Failed to save match:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-gray-600">Loading match...</div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Match not found</p>
          <Link to="/matches" className="text-primary-600 hover:text-primary-700">
            Back to matches
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <div className="flex items-center">
          <Link to="/matches" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Match Scoring</h1>
            <div className="flex items-center text-sm text-gray-600">
              <Trophy className="h-4 w-4 mr-1" />
              <span>{match.league_name}</span>
              <span className="mx-2">•</span>
              <span>{match.category_name}</span>
              {match.court_number && (
                <>
                  <span className="mx-2">•</span>
                  <span>Court {match.court_number}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            matchStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            matchStatus === 'in_progress' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {matchStatus === 'pending' ? 'Pending' : matchStatus === 'in_progress' ? 'Live' : 'Completed'}
          </span>
          {match.is_trump_match && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              Trump
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Failed to load match</p>
        </div>
      )}

      {/* Match Completed Message */}
      {matchStatus === 'completed' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 font-medium">
            🎉 Match Completed! Winner: {team1Score > team2Score ? match.team1_name : match.team2_name}
          </p>
        </div>
      )}

      {/* Score Display */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Team 1 */}
          <div className="text-center">
            <div className="font-semibold text-gray-900 mb-2">{match.team1_name}</div>
            <div className="text-sm text-gray-600 mb-4">
              {match.team1_player1_name}
              {match.team1_player1_dupr && (
                <span className="text-gray-400"> ({match.team1_player1_dupr})</span>
              )}
              {match.team1_player2_name && (
                <>
                  <br />{match.team1_player2_name}
                  {match.team1_player2_dupr && (
                    <span className="text-gray-400"> ({match.team1_player2_dupr})</span>
                  )}
                </>
              )}
            </div>
            <div className="text-4xl font-bold text-primary-600">{team1Score}</div>
          </div>

          {/* VS and Start Button */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-gray-400 text-lg font-medium mb-4">VS</div>
            {matchStatus === 'pending' && (
              <button
                onClick={startMatch}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Match
              </button>
            )}
          </div>

          {/* Team 2 */}
          <div className="text-center">
            <div className="font-semibold text-gray-900 mb-2">{match.team2_name}</div>
            <div className="text-sm text-gray-600 mb-4">
              {match.team2_player1_name}
              {match.team2_player1_dupr && (
                <span className="text-gray-400"> ({match.team2_player1_dupr})</span>
              )}
              {match.team2_player2_name && (
                <>
                  <br />{match.team2_player2_name}
                  {match.team2_player2_dupr && (
                    <span className="text-gray-400"> ({match.team2_player2_dupr})</span>
                  )}
                </>
              )}
            </div>
            <div className="text-4xl font-bold text-blue-600">{team2Score}</div>
          </div>
        </div>
      </div>

      {/* Game Scoring */}
      {matchStatus !== 'pending' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Scores</h3>

          <div className="space-y-6">
            {[1, 2, 3].map((gameNum) => (
              <div key={gameNum} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">Game {gameNum}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    gameNum === currentGame ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {gameNum === currentGame ? 'Current' : gameNum < currentGame ? 'Completed' : 'Upcoming'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Team 1 Game Score */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {match.team1_name} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={
                        gameNum === 1 ? team1Game1 :
                        gameNum === 2 ? team1Game2 :
                        team1Game3
                      }
                      onChange={(e) => updateGameScore('team1', gameNum, parseInt(e.target.value) || 0)}
                      disabled={matchStatus === 'completed'}
                      className="w-full p-3 border border-gray-300 rounded-lg text-center text-lg font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  {/* Team 2 Game Score */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {match.team2_name} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={
                        gameNum === 1 ? team2Game1 :
                        gameNum === 2 ? team2Game2 :
                        team2Game3
                      }
                      onChange={(e) => updateGameScore('team2', gameNum, parseInt(e.target.value) || 0)}
                      disabled={matchStatus === 'completed'}
                      className="w-full p-3 border border-gray-300 rounded-lg text-center text-lg font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      {matchStatus !== 'pending' && matchStatus !== 'completed' && (
        <button
          onClick={saveMatch}
          disabled={saving}
          className="w-full py-4 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-3" />
              Save Match
            </>
          )}
        </button>
      )}
    </div>
  )
}

export default ScoringPage