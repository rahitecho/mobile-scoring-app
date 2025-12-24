import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Trophy, Clock, Plus } from 'lucide-react';
import { useGetUmpireMatchesQuery } from '@/store/api';
import { useAuth } from '@/contexts/AuthContext';
import type { MatchWithDetails } from '../types';

const MatchListPage = () => {
  const navigate = useNavigate();
  const { leagueId } = useParams<{ leagueId: string }>();
  const { user } = useAuth();
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'in_progress' | 'completed'
  >('pending');

  // RTK Query hook - use umpire-specific matches for this league
  const {
    data: matches = [],
    isLoading: loading,
    error,
  } = useGetUmpireMatchesQuery(
    { umpireId: user?.id || '', leagueId: leagueId || '' },
    { skip: !user?.id || !leagueId }
  );

  const filteredMatches = matches.filter((match) => {
    if (filter === 'all') return true;
    return match.status === filter;
  });

  console.log('filteredMatches', JSON.stringify(filteredMatches));

  // Get league name from first match
  const leagueName = matches.length > 0 ? matches[0].league_name : 'League';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900/20 border-yellow-500 text-yellow-400';
      case 'in_progress':
        return 'bg-green-900/20 border-green-500 text-green-400';
      case 'completed':
        return 'bg-blue-900/20 border-blue-500 text-blue-400';
      default:
        return 'bg-gray-900/20 border-gray-500 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Upcoming';
      case 'in_progress':
        return 'Live';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const getWinner = (match: MatchWithDetails) => {
    if (match.status !== 'completed') return null;
    if (!match.team1_score && !match.team2_score) return null;

    const team1Score = match.team1_score || 0;
    const team2Score = match.team2_score || 0;

    if (team1Score > team2Score) return 'team1';
    if (team2Score > team1Score) return 'team2';
    return null; // Tie
  };

  const handleMatchClick = (matchId: string, status: string) => {
    navigate(`/league/${leagueId}/match/${matchId}/score`);
  };

  return (
    <div className='min-h-screen bg-background text-foreground'>
      {/* Header */}
      <div className='flex items-center p-6 border-b border-border'>
        <Link
          to={`/league/${leagueId}`}
          className='p-2 hover:bg-accent rounded-lg mr-4'
        >
          <ArrowLeft className='h-6 w-6 text-muted-foreground' />
        </Link>
        <div>
          <h1 className='text-xl font-light'>{leagueName}</h1>
          <p className='text-muted-foreground text-sm'>All Matches</p>
        </div>
      </div>

      <div className='p-6'>
        {/* Filter Tabs */}
        <div className='flex space-x-1 mb-6 bg-muted p-1 rounded-lg'>
          {[
            { key: 'pending', label: 'Upcoming' },
            { key: 'in_progress', label: 'Live' },
            { key: 'completed', label: 'Completed' },
            { key: 'all', label: 'All Matches' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className='bg-destructive/20 border border-destructive rounded-lg p-4 mb-6'>
            <p className='text-destructive'>Failed to load matches</p>
          </div>
        )}

        {loading ? (
          <div className='text-center py-12'>
            <div className='text-muted-foreground'>Loading matches...</div>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className='text-center py-12'>
            <Trophy className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
            <p className='text-muted-foreground mb-4'>No matches found</p>
            <Link
              to={`/league/${leagueId}`}
              className='inline-flex items-center px-4 py-2 btn-gradient rounded-lg transition-colors'
            >
              Create New Match
            </Link>
          </div>
        ) : (
          <div className='space-y-4'>
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => handleMatchClick(match.id, match.status)}
                className={`card-modern overflow-hidden ${
                  match.status !== 'completed'
                    ? 'cursor-pointer hover:shadow-lg'
                    : ''
                } transition-all`}
              >
                {/* Match Header */}
                <div className='p-4 border-b border-border'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          match.status
                        )}`}
                      >
                        {getStatusText(match.status)}
                      </span>
                      {match.is_trump_match && (
                        <span className='px-2 py-1 bg-yellow-900/20 border border-yellow-500 text-yellow-400 rounded-full text-xs font-medium'>
                          Trump Match
                        </span>
                      )}
                    </div>
                    {match.status !== 'completed' && (
                      <Play className='h-4 w-4 text-gray-500' />
                    )}
                  </div>

                  <div className='flex items-center text-sm text-muted-foreground'>
                    <Trophy className='h-4 w-4 mr-1' />
                    <span>{match.category_name}</span>
                    {match.court_number && (
                      <>
                        <span className='mx-2'>•</span>
                        <span>Court {match.court_number}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Team Information */}
                <div className='p-4'>
                  <div className='space-y-3'>
                    {(() => {
                      const winner = getWinner(match);
                      return (
                        <>
                          {/* Team 1 */}
                          <div className='flex items-center justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center'>
                                {winner === 'team1' && (
                                  <Trophy className='h-4 w-4 text-yellow-400 mr-2' />
                                )}
                                <div
                                  className={`font-medium ${
                                    winner === 'team1'
                                      ? 'text-yellow-400'
                                      : 'text-white'
                                  }`}
                                >
                                  {match.team1_name}
                                  {winner === 'team1' && (
                                    <span className='ml-2 text-xs text-yellow-400'>
                                      (Winner)
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className='text-sm text-muted-foreground mt-1'>
                                {match.team1_player1_name}
                                {match.team1_player1_dupr && (
                                  <span className='ml-1 text-muted-foreground/70'>
                                    ({match.team1_player1_dupr})
                                  </span>
                                )}
                                {match.team1_player2_name && (
                                  <>
                                    {' & '}
                                    {match.team1_player2_name}
                                    {match.team1_player2_dupr && (
                                      <span className='ml-1 text-muted-foreground/70'>
                                        ({match.team1_player2_dupr})
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            {/* <div className={`text-2xl font-bold ml-4 ${
                              winner === 'team1' ? 'text-yellow-400' : 'text-white'
                            }`}>
                              {match.team1_score}
                            </div> */}
                          </div>

                          {/* VS Divider */}
                          <div className='text-center text-gray-500 text-sm font-medium'>
                            VS
                          </div>

                          {/* Team 2 */}
                          <div className='flex items-center justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center'>
                                {winner === 'team2' && (
                                  <Trophy className='h-4 w-4 text-yellow-400 mr-2' />
                                )}
                                <div
                                  className={`font-medium ${
                                    winner === 'team2'
                                      ? 'text-yellow-400'
                                      : 'text-white'
                                  }`}
                                >
                                  {match.team2_name}
                                  {winner === 'team2' && (
                                    <span className='ml-2 text-xs text-yellow-400'>
                                      (Winner)
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className='text-sm text-gray-400 mt-1'>
                                {match.team2_player1_name}
                                {match.team2_player1_dupr && (
                                  <span className='ml-1 text-gray-500'>
                                    ({match.team2_player1_dupr})
                                  </span>
                                )}
                                {match.team2_player2_name && (
                                  <>
                                    {' & '}
                                    {match.team2_player2_name}
                                    {match.team2_player2_dupr && (
                                      <span className='ml-1 text-gray-500'>
                                        ({match.team2_player2_dupr})
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            {/* <div
                              className={`text-2xl font-bold ml-4 ${
                                winner === 'team2'
                                  ? 'text-yellow-400'
                                  : 'text-white'
                              }`}
                            >
                              {match.team2_score}
                            </div> */}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Game Scores */}
                  {(match.team1_game1 !== undefined ||
                    match.team2_game1 !== undefined) && (
                    <div className='mt-4 pt-3 border-t border-border'>
                      <div className='text-sm text-gray-500 mb-2'>
                        Set Scores:
                      </div>
                      <div className='flex space-x-4 text-sm'>
                        {[1, 2, 3].map((gameNum) => {
                          const team1Score = match[
                            `team1_game${gameNum}` as keyof MatchWithDetails
                          ] as number;
                          const team2Score = match[
                            `team2_game${gameNum}` as keyof MatchWithDetails
                          ] as number;

                          if (
                            team1Score === undefined &&
                            team2Score === undefined
                          )
                            return null;

                          return (
                            <div key={gameNum} className='text-center'>
                              <div className='text-gray-500'>S{gameNum}</div>
                              <div className='font-medium text-gray-500'>
                                {team1Score ?? 0}-{team2Score ?? 0}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Match Time */}
                  {(match.start_time ||
                    match.completed_at ||
                    match.scheduled_time) && (
                    <div className='mt-3 flex items-center text-xs text-gray-500'>
                      <Clock className='h-3 w-3 mr-1' />
                      {match.completed_at ? (
                        <span>
                          Completed{' '}
                          {new Date(match.completed_at).toLocaleDateString()}
                        </span>
                      ) : match.start_time ? (
                        <span>
                          Started{' '}
                          {new Date(match.start_time).toLocaleDateString()}
                        </span>
                      ) : match.scheduled_time ? (
                        <span>
                          Scheduled{' '}
                          {new Date(match.scheduled_time).toLocaleDateString()}
                        </span>
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
          to={`/league/${leagueId}`}
          className='fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors'
        >
          <Plus className='h-6 w-6' />
        </Link>
      </div>
    </div>
  );
};

export default MatchListPage;
