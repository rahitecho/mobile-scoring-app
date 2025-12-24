import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Users, Check, Loader2 } from 'lucide-react';
import {
  useGetLeagueTeamMembersQuery,
  useCreateMatchMutation,
  useGetLeagueCategoriesQuery,
} from '@/store/api';
import { useAuth } from '@/contexts/AuthContext';

interface LocationState {
  team1Id: string;
  team2Id: string;
  leagueGroupId: string;
}

const PlayerSelectionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { leagueId, categoryId } = useParams<{
    leagueId: string;
    categoryId: string;
  }>();
  const location = useLocation();
  const state = location.state as LocationState;

  const [selectedPlayers, setSelectedPlayers] = useState({
    team1_player1: '',
    team1_player2: '',
    team2_player1: '',
    team2_player2: '',
  });

  // Fetch team members for both teams
  const { data: team1Members = [], isLoading: loadingTeam1 } =
    useGetLeagueTeamMembersQuery(state?.team1Id || '', {
      skip: !state?.team1Id,
    });

  const { data: team2Members = [], isLoading: loadingTeam2 } =
    useGetLeagueTeamMembersQuery(state?.team2Id || '', {
      skip: !state?.team2Id,
    });

  // Fetch categories to determine match type
  const { data: categories = [] } = useGetLeagueCategoriesQuery(
    leagueId || '',
    {
      skip: !leagueId,
    }
  );

  const [createMatch, { isLoading: isCreatingMatch }] =
    useCreateMatchMutation();

  const isLoading = loadingTeam1 || loadingTeam2;

  // Redirect if no team data
  useEffect(() => {
    if (!state?.team1Id || !state?.team2Id || !state.leagueGroupId) {
      navigate(`/league/${leagueId}/category/${categoryId}`);
    }
  }, [state, navigate, leagueId, categoryId]);

  const handlePlayerSelect = (position: string, playerId: string) => {
    setSelectedPlayers((prev) => ({
      ...prev,
      [position]: playerId,
    }));
  };

  const handleContinue = async () => {
    // Check if at least the required players are selected
    if (!selectedPlayers.team1_player1 || !selectedPlayers.team2_player1) {
      return;
    }

    try {
      // Use category to determine match type
      const matchType = isSinglesCategory ? 'singles' : 'doubles';

      const matchData = {
        league_id: leagueId!,
        category_id: categoryId!,
        team1_id: state.team1Id,
        team2_id: state.team2Id,
        match_type: matchType,
        team1_player1_id: selectedPlayers.team1_player1,
        team1_player2_id: !isSinglesCategory
          ? selectedPlayers.team1_player2
          : undefined,
        team2_player1_id: selectedPlayers.team2_player1,
        team2_player2_id: !isSinglesCategory
          ? selectedPlayers.team2_player2
          : undefined,
        is_trump_match: false, // Default to false
        scheduled_time: new Date().toISOString(),
        assigned_umpire_id: user?.id,
        league_group_id: state.leagueGroupId,
      };

      const result = await createMatch(matchData).unwrap();

      // Navigate directly to scoring page
      navigate(`/league/${leagueId}/match/${result.id}/score`);
    } catch (error) {
      console.error('Error creating match:', error);
      // You could add error handling here with a toast notification
    }
  };

  const handleBack = () => {
    navigate(`/league/${leagueId}/category/${categoryId}`);
  };

  const getPlayerName = (playerId: string, teamMembers: any[]) => {
    const member = teamMembers.find((m) => m.player_id === playerId);
    return member?.player?.name || 'Unknown Player';
  };

  const isPlayerSelected = (playerId: string) => {
    return Object.values(selectedPlayers).includes(playerId);
  };

  // Determine if this is a singles or doubles category
  const currentCategory = categories.find(
    (cat) => cat.category_id === categoryId
  );
  const isSinglesCategory = currentCategory?.name
    ?.toLowerCase()
    .includes('singles');

  const canContinue = () => {
    // Check if at least team1_player1 and team2_player1 are selected
    const requiredPlayersSelected =
      selectedPlayers.team1_player1 && selectedPlayers.team2_player1;

    // For doubles, also require player 2 for both teams
    if (!isSinglesCategory) {
      return (
        requiredPlayersSelected &&
        selectedPlayers.team1_player2 &&
        selectedPlayers.team2_player2
      );
    }

    return requiredPlayersSelected;
  };

  return (
    <div className='min-h-screen bg-background text-foreground'>
      {/* Header */}
      <div className='flex items-center justify-between p-6 border-b border-border'>
        <div className='flex items-center gap-4'>
          <button
            onClick={handleBack}
            className='p-2 hover:bg-accent rounded-lg transition-colors'
          >
            <ArrowLeft className='h-5 w-5' />
          </button>
          <div>
            <h1 className='text-2xl font-light'>Select Players</h1>
            <p className='text-muted-foreground text-sm'>
              Choose players for each team position
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='p-6'>
        {isLoading && (
          <div className='text-center py-12'>
            <div className='text-muted-foreground'>Loading team members...</div>
          </div>
        )}

        {!isLoading && (
          <div className='space-y-8'>
            {/* Team 1 Players */}
            <div className='space-y-4'>
              <h2 className='text-lg font-medium text-foreground flex items-center gap-2'>
                <Users className='h-5 w-5 text-primary' />
                Team 1 Players
              </h2>

              <div className='grid gap-4 md:grid-cols-2'>
                {/* Team 1 Player 1 */}
                <div className='space-y-2'>
                  <h3 className='font-medium text-sm'>Player 1 (Required)</h3>
                  <div className='grid gap-2'>
                    {team1Members.map((member) => (
                      <div
                        key={member.id}
                        onClick={() =>
                          handlePlayerSelect('team1_player1', member.player_id)
                        }
                        className={`cursor-pointer p-3 rounded-lg border transition-all ${
                          selectedPlayers.team1_player1 === member.player_id
                            ? 'bg-primary text-white border-primary'
                            : isPlayerSelected(member.player_id)
                            ? 'bg-muted border-muted opacity-50 cursor-not-allowed'
                            : 'hover:bg-accent border-border'
                        }`}
                        style={{
                          pointerEvents:
                            isPlayerSelected(member.player_id) &&
                            selectedPlayers.team1_player1 !== member.player_id
                              ? 'none'
                              : 'auto',
                        }}
                      >
                        <div className='flex items-center gap-3'>
                          {selectedPlayers.team1_player1 ===
                          member.player_id ? (
                            <Check className='h-4 w-4' />
                          ) : (
                            <User className='h-4 w-4' />
                          )}
                          <span className='text-sm'>{member.player?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team 1 Player 2 - Only show for doubles */}
                {!isSinglesCategory && (
                  <div className='space-y-2'>
                    <h3 className='font-medium text-sm'>Player 2 (Doubles)</h3>
                    <div className='grid gap-2'>
                      {team1Members.map((member) => (
                        <div
                          key={member.id}
                          onClick={() =>
                            handlePlayerSelect(
                              'team1_player2',
                              member.player_id
                            )
                          }
                          className={`cursor-pointer p-3 rounded-lg border transition-all ${
                            selectedPlayers.team1_player2 === member.player_id
                              ? 'bg-primary text-white border-primary'
                              : isPlayerSelected(member.player_id)
                              ? 'bg-muted border-muted opacity-50 cursor-not-allowed'
                              : 'hover:bg-accent border-border'
                          }`}
                          style={{
                            pointerEvents:
                              isPlayerSelected(member.player_id) &&
                              selectedPlayers.team1_player2 !== member.player_id
                                ? 'none'
                                : 'auto',
                          }}
                        >
                          <div className='flex items-center gap-3'>
                            {selectedPlayers.team1_player2 ===
                            member.player_id ? (
                              <Check className='h-4 w-4' />
                            ) : (
                              <User className='h-4 w-4' />
                            )}
                            <span className='text-sm'>
                              {member.player?.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Team 2 Players */}
            <div className='space-y-4'>
              <h2 className='text-lg font-medium text-foreground flex items-center gap-2'>
                <Users className='h-5 w-5 text-primary' />
                Team 2 Players
              </h2>

              <div className='grid gap-4 md:grid-cols-2'>
                {/* Team 2 Player 1 */}
                <div className='space-y-2'>
                  <h3 className='font-medium text-sm'>Player 1 (Required)</h3>
                  <div className='grid gap-2'>
                    {team2Members.map((member) => (
                      <div
                        key={member.id}
                        onClick={() =>
                          handlePlayerSelect('team2_player1', member.player_id)
                        }
                        className={`cursor-pointer p-3 rounded-lg border transition-all ${
                          selectedPlayers.team2_player1 === member.player_id
                            ? 'bg-primary text-white border-primary'
                            : isPlayerSelected(member.player_id)
                            ? 'bg-muted border-muted opacity-50 cursor-not-allowed'
                            : 'hover:bg-accent border-border'
                        }`}
                        style={{
                          pointerEvents:
                            isPlayerSelected(member.player_id) &&
                            selectedPlayers.team2_player1 !== member.player_id
                              ? 'none'
                              : 'auto',
                        }}
                      >
                        <div className='flex items-center gap-3'>
                          {selectedPlayers.team2_player1 ===
                          member.player_id ? (
                            <Check className='h-4 w-4' />
                          ) : (
                            <User className='h-4 w-4' />
                          )}
                          <span className='text-sm'>{member.player?.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team 2 Player 2 - Only show for doubles */}
                {!isSinglesCategory && (
                  <div className='space-y-2'>
                    <h3 className='font-medium text-sm'>Player 2 (Doubles)</h3>
                    <div className='grid gap-2'>
                      {team2Members.map((member) => (
                        <div
                          key={member.id}
                          onClick={() =>
                            handlePlayerSelect(
                              'team2_player2',
                              member.player_id
                            )
                          }
                          className={`cursor-pointer p-3 rounded-lg border transition-all ${
                            selectedPlayers.team2_player2 === member.player_id
                              ? 'bg-primary text-white border-primary'
                              : isPlayerSelected(member.player_id)
                              ? 'bg-muted border-muted opacity-50 cursor-not-allowed'
                              : 'hover:bg-accent border-border'
                          }`}
                          style={{
                            pointerEvents:
                              isPlayerSelected(member.player_id) &&
                              selectedPlayers.team2_player2 !== member.player_id
                                ? 'none'
                                : 'auto',
                          }}
                        >
                          <div className='flex items-center gap-3'>
                            {selectedPlayers.team2_player2 ===
                            member.player_id ? (
                              <Check className='h-4 w-4' />
                            ) : (
                              <User className='h-4 w-4' />
                            )}
                            <span className='text-sm'>
                              {member.player?.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selection Summary & Continue Button */}
            {canContinue() && (
              <div className='bg-muted/20 p-4 rounded-lg'>
                <h3 className='font-medium mb-2'>Selected Players:</h3>
                <div className='text-sm text-muted-foreground space-y-1'>
                  {selectedPlayers.team1_player1 && (
                    <div>
                      Team 1 Player 1:{' '}
                      {getPlayerName(
                        selectedPlayers.team1_player1,
                        team1Members
                      )}
                    </div>
                  )}
                  {selectedPlayers.team1_player2 && (
                    <div>
                      Team 1 Player 2:{' '}
                      {getPlayerName(
                        selectedPlayers.team1_player2,
                        team1Members
                      )}
                    </div>
                  )}
                  {selectedPlayers.team2_player1 && (
                    <div>
                      Team 2 Player 1:{' '}
                      {getPlayerName(
                        selectedPlayers.team2_player1,
                        team2Members
                      )}
                    </div>
                  )}
                  {selectedPlayers.team2_player2 && (
                    <div>
                      Team 2 Player 2:{' '}
                      {getPlayerName(
                        selectedPlayers.team2_player2,
                        team2Members
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleContinue}
                  disabled={isCreatingMatch}
                  className='btn-gradient w-full mt-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isCreatingMatch ? (
                    <>
                      <Loader2 className='inline-block w-4 h-4 mr-2 animate-spin' />
                      Creating Match...
                    </>
                  ) : (
                    'Create Match & Start Scoring'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerSelectionPage;
