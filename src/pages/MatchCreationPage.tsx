import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Users, Trophy, Clock } from 'lucide-react'
import {
  useGetLeaguesQuery,
  useGetLeagueCategoriesQuery,
  useGetLeagueTeamsQuery,
  useGetLeagueTeamMembersQuery,
  useCreateMatchMutation
} from '@/store/api'
import type { LeagueTeamMember, CreateMatchRequest } from '../types'

const matchSchema = z.object({
  league_id: z.string().min(1, 'Please select a league'),
  category_id: z.string().min(1, 'Please select a category'),
  team1_id: z.string().min(1, 'Please select team 1'),
  team2_id: z.string().min(1, 'Please select team 2'),
  team1_player1_id: z.string().min(1, 'Please select team 1 player 1'),
  team1_player2_id: z.string().optional(),
  team2_player1_id: z.string().min(1, 'Please select team 2 player 1'),
  team2_player2_id: z.string().optional(),
  is_trump_match: z.boolean().default(false),
  court_number: z.number().optional(),
})

type MatchFormData = z.infer<typeof matchSchema>

const MatchCreationPage = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      is_trump_match: false,
    }
  })

  const selectedLeagueId = watch('league_id')
  const selectedCategoryId = watch('category_id')
  const selectedTeam1Id = watch('team1_id')
  const selectedTeam2Id = watch('team2_id')

  // RTK Query hooks
  const { data: leagues = [], isLoading: isLoadingLeagues } = useGetLeaguesQuery()
  const { data: categories = [], isLoading: isLoadingCategories } = useGetLeagueCategoriesQuery(
    selectedLeagueId || '',
    { skip: !selectedLeagueId }
  )
  const { data: teams = [], isLoading: isLoadingTeams } = useGetLeagueTeamsQuery(
    selectedLeagueId || '',
    { skip: !selectedLeagueId }
  )
  const { data: team1Members = [] } = useGetLeagueTeamMembersQuery(
    selectedTeam1Id || '',
    { skip: !selectedTeam1Id }
  )
  const { data: team2Members = [] } = useGetLeagueTeamMembersQuery(
    selectedTeam2Id || '',
    { skip: !selectedTeam2Id }
  )
  const [createMatch, { isLoading: isCreatingMatch }] = useCreateMatchMutation()

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  // Reset form fields when league changes
  useEffect(() => {
    if (selectedLeagueId) {
      setValue('category_id', '')
      setValue('team1_id', '')
      setValue('team2_id', '')
    }
  }, [selectedLeagueId, setValue])

  // Reset player fields when teams change
  useEffect(() => {
    if (selectedTeam1Id) {
      setValue('team1_player1_id', '')
      setValue('team1_player2_id', '')
    }
  }, [selectedTeam1Id, setValue])

  useEffect(() => {
    if (selectedTeam2Id) {
      setValue('team2_player1_id', '')
      setValue('team2_player2_id', '')
    }
  }, [selectedTeam2Id, setValue])

  const onSubmit = async (data: MatchFormData) => {
    try {
      setError(null)

      const matchData: CreateMatchRequest = {
        league_id: data.league_id,
        category_id: data.category_id,
        team1_id: data.team1_id,
        team2_id: data.team2_id,
        match_type: selectedCategory?.match_type || 'singles',
        team1_player1_id: data.team1_player1_id,
        team1_player2_id: selectedCategory?.match_type === 'doubles' ? data.team1_player2_id : undefined,
        team2_player1_id: data.team2_player1_id,
        team2_player2_id: selectedCategory?.match_type === 'doubles' ? data.team2_player2_id : undefined,
        is_trump_match: data.is_trump_match,
        court_number: data.court_number,
        scheduled_time: new Date().toISOString(),
      }

      await createMatch(matchData).unwrap()
      navigate('/matches')
    } catch (err) {
      setError('Failed to create match')
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center mb-6 pt-4">
        <Link to="/" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Match</h1>
          <p className="text-gray-600">Set up a new league match</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* League Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <Trophy className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">League & Category</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                League
              </label>
              <select
                {...register('league_id')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a league</option>
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name}
                  </option>
                ))}
              </select>
              {errors.league_id && (
                <p className="text-red-600 text-sm mt-1">{errors.league_id.message}</p>
              )}
            </div>

            {selectedLeagueId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  {...register('category_id')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.match_type}) - {category.win_points} pts
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-red-600 text-sm mt-1">{errors.category_id.message}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Team Selection */}
        {selectedCategoryId && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Teams</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team 1
                  </label>
                  <select
                    {...register('team1_id')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select team 1</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {errors.team1_id && (
                    <p className="text-red-600 text-sm mt-1">{errors.team1_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team 2
                  </label>
                  <select
                    {...register('team2_id')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select team 2</option>
                    {teams.filter(team => team.id !== selectedTeam1Id).map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {errors.team2_id && (
                    <p className="text-red-600 text-sm mt-1">{errors.team2_id.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Player Selection */}
        {selectedTeam1Id && selectedTeam2Id && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Player Selection</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team 1 Players */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Team 1 Players</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Player 1 *
                    </label>
                    <select
                      {...register('team1_player1_id')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select player 1</option>
                      {team1Members.map((member) => (
                        <option key={member.id} value={member.player_id}>
                          {member.player?.name}
                        </option>
                      ))}
                    </select>
                    {errors.team1_player1_id && (
                      <p className="text-red-600 text-sm mt-1">{errors.team1_player1_id.message}</p>
                    )}
                  </div>

                  {selectedCategory?.match_type === 'doubles' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Player 2 *
                      </label>
                      <select
                        {...register('team1_player2_id')}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select player 2</option>
                        {team1Members
                          .filter(member => member.player_id !== watch('team1_player1_id'))
                          .map((member) => (
                            <option key={member.id} value={member.player_id}>
                              {member.player?.name}
                            </option>
                          ))}
                      </select>
                      {errors.team1_player2_id && (
                        <p className="text-red-600 text-sm mt-1">{errors.team1_player2_id.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Team 2 Players */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Team 2 Players</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Player 1 *
                    </label>
                    <select
                      {...register('team2_player1_id')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select player 1</option>
                      {team2Members.map((member) => (
                        <option key={member.id} value={member.player_id}>
                          {member.player?.name}
                        </option>
                      ))}
                    </select>
                    {errors.team2_player1_id && (
                      <p className="text-red-600 text-sm mt-1">{errors.team2_player1_id.message}</p>
                    )}
                  </div>

                  {selectedCategory?.match_type === 'doubles' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Player 2 *
                      </label>
                      <select
                        {...register('team2_player2_id')}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select player 2</option>
                        {team2Members
                          .filter(member => member.player_id !== watch('team2_player1_id'))
                          .map((member) => (
                            <option key={member.id} value={member.player_id}>
                              {member.player?.name}
                            </option>
                          ))}
                      </select>
                      {errors.team2_player2_id && (
                        <p className="text-red-600 text-sm mt-1">{errors.team2_player2_id.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Match Options */}
        {selectedCategoryId && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <Clock className="h-5 w-5 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Match Options</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_trump_match')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-3 block text-sm text-gray-700">
                  <span className="font-medium">Trump Match</span>
                  <span className="block text-gray-500">
                    Double points for this match ({selectedCategory?.win_points ? selectedCategory.win_points * 2 : 0} pts)
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Court Number (Optional)
                </label>
                <input
                  type="number"
                  {...register('court_number', { valueAsNumber: true })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter court number"
                  min="1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {selectedCategoryId && (
          <div className="flex gap-4">
            <Link
              to="/"
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 text-center rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isCreatingMatch}
              className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting || isCreatingMatch ? 'Creating...' : 'Create Match'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

export default MatchCreationPage