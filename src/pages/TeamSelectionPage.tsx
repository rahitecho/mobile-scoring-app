import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Check, Grid3x3 } from 'lucide-react';
import {
  useGetLeagueTeamsQuery,
  useGetLeagueGroupsQuery,
  useGetLeagueGroupTeamsQuery,
} from '@/store/api';

const TeamSelectionPage = () => {
  const navigate = useNavigate();
  const { leagueId, categoryId } = useParams<{
    leagueId: string;
    categoryId: string;
  }>();
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [groupError, setGroupError] = useState<string | null>(null);

  // Fetch all teams for fallback display
  const {
    data: allTeams = [],
    isLoading: teamsLoading,
    error: teamsError,
  } = useGetLeagueTeamsQuery(leagueId || '', {
    skip: !leagueId,
  });

  // Fetch league groups
  const { data: groups = [], isLoading: groupsLoading } =
    useGetLeagueGroupsQuery(
      { league_id: leagueId || '' },
      {
        skip: !leagueId,
      }
    );

  // Fetch all group teams for the league
  const { data: allGroupTeams = [], isLoading: groupTeamsLoading } =
    useGetLeagueGroupTeamsQuery(
      { league_id: leagueId || '' },
      {
        skip: !leagueId,
      }
    );

  const loading = teamsLoading || groupsLoading || groupTeamsLoading;
  const error = teamsError;
  const hasGroups = groups && groups.length > 0;

  // Helper function to get group ID for a team
  const getTeamGroupId = (teamId: string): string | null => {
    const groupTeam = allGroupTeams.find((gt: any) => gt.team_id === teamId);
    return groupTeam ? groupTeam.group_id : null;
  };

  // Helper function to get group name for a team
  const getTeamGroupName = (teamId: string): string => {
    const groupId = getTeamGroupId(teamId);
    if (!groupId) return 'Unknown Group';
    const group = groups.find((g: any) => g.id === groupId);
    return group?.name || 'Unknown Group';
  };

  const handleTeamSelect = (teamId: string) => {
    // Clear any previous error
    setGroupError(null);

    if (selectedTeams.includes(teamId)) {
      // Deselect team
      setSelectedTeams(selectedTeams.filter((id) => id !== teamId));
      return;
    }

    if (selectedTeams.length === 0) {
      // First team selection - always allowed
      setSelectedTeams([teamId]);
    } else if (selectedTeams.length === 1) {
      // Second team selection - validate same group
      const firstTeamGroupId = getTeamGroupId(selectedTeams[0]);
      const secondTeamGroupId = getTeamGroupId(teamId);

      if (
        hasGroups &&
        firstTeamGroupId &&
        secondTeamGroupId &&
        firstTeamGroupId !== secondTeamGroupId
      ) {
        // Teams are from different groups - show error
        const firstGroupName = getTeamGroupName(selectedTeams[0]);
        const secondGroupName = getTeamGroupName(teamId);
        setGroupError(
          `Teams must be from the same group. First team is from "${firstGroupName}", selected team is from "${secondGroupName}".`
        );
        return;
      }

      // Teams are from same group or no groups - allow selection
      setSelectedTeams([...selectedTeams, teamId]);
    } else {
      // Already have 2 teams - replace the first one
      // Need to validate the new team with the second team
      const secondTeamGroupId = getTeamGroupId(selectedTeams[1]);
      const newTeamGroupId = getTeamGroupId(teamId);

      if (
        hasGroups &&
        secondTeamGroupId &&
        newTeamGroupId &&
        secondTeamGroupId !== newTeamGroupId
      ) {
        // Teams are from different groups - show error
        const secondGroupName = getTeamGroupName(selectedTeams[1]);
        const newGroupName = getTeamGroupName(teamId);
        setGroupError(
          `Teams must be from the same group. Current team is from "${secondGroupName}", selected team is from "${newGroupName}".`
        );
        return;
      }

      // Teams are from same group or no groups - allow replacement
      setSelectedTeams([selectedTeams[1], teamId]);
    }
  };

  const handleContinue = () => {
    if (selectedTeams.length === 2) {
      navigate(`/league/${leagueId}/category/${categoryId}/teams`, {
        state: {
          team1Id: selectedTeams[0],
          team2Id: selectedTeams[1],
          leagueGroupId: getTeamGroupId(selectedTeams[0]),
        },
      });
    }
  };

  const handleBack = () => {
    navigate(`/league/${leagueId}`);
  };

  const getTeamLabel = (teamId: string) => {
    const index = selectedTeams.indexOf(teamId);
    if (index === 0) return 'Team 1';
    if (index === 1) return 'Team 2';
    return null;
  };

  // Helper function to get teams for a specific group
  const getGroupTeams = (groupId: string) => {
    const groupTeams = allGroupTeams.filter(
      (groupTeam: any) => groupTeam.group_id === groupId
    );
    return groupTeams.map((groupTeam: any) => ({
      id: groupTeam.team_id,
      name: groupTeam.team_name || 'Unknown Team',
      description: '',
      status: 'active',
    }));
  };

  // Function to get team name for selection summary
  const getTeamName = (teamId: string) => {
    // First check group teams
    const groupTeam = allGroupTeams.find((gt: any) => gt.team_id === teamId);
    if (groupTeam) {
      return groupTeam.team_name || 'Unknown Team';
    }
    // Fallback to all teams
    const team = allTeams.find((t: any) => t.id === teamId);
    return team?.name || 'Unknown Team';
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
            <h1 className='text-2xl font-light'>Select Teams</h1>
            <p className='text-muted-foreground text-sm'>
              Choose 2 teams that will compete
            </p>
          </div>
        </div>
      </div>

      {/* Group Error Message */}
      {groupError && (
        <div className='p-4 mx-6 mt-6 bg-destructive/20 border border-destructive rounded-lg'>
          <p className='text-destructive text-sm'>{groupError}</p>
        </div>
      )}

      {/* Selection Summary */}
      {selectedTeams.length > 0 && (
        <div className='p-6 bg-muted/20 border-b border-border'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='font-medium mb-2'>
                Selected Teams ({selectedTeams.length}/2):
              </h3>
              <div className='text-sm text-muted-foreground'>
                {selectedTeams.map((teamId, index) => (
                  <div key={teamId}>
                    Team {index + 1}: {getTeamName(teamId)}
                    {hasGroups && (
                      <span className='ml-2 text-xs text-primary'>
                        ({getTeamGroupName(teamId)})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {selectedTeams.length === 2 && (
              <button
                onClick={handleContinue}
                className='btn-gradient px-6 py-2 rounded-lg'
              >
                Continue
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className='p-6'>
        {loading && (
          <div className='text-center py-12'>
            <div className='text-muted-foreground'>Loading teams...</div>
          </div>
        )}

        {error && (
          <div className='p-4 bg-destructive/20 border border-destructive rounded-lg mb-6'>
            <p className='text-destructive'>Failed to load teams</p>
          </div>
        )}

        {!loading && !hasGroups && allTeams.length === 0 && (
          <div className='text-center py-12'>
            <Users className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-xl text-foreground mb-2'>No Teams Available</h3>
            <p className='text-muted-foreground'>
              No teams are registered for this league yet.
            </p>
            <p className='text-muted-foreground mt-2'>
              Contact the league organizer to register teams.
            </p>
          </div>
        )}

        {!loading && hasGroups && (
          <div className='space-y-6'>
            <h2 className='text-lg text-foreground mb-6 flex items-center gap-2'>
              <Grid3x3 className='h-5 w-5 text-primary' />
              Select Teams by Groups
            </h2>

            {groups.map((group: any) => {
              const groupTeams = getGroupTeams(group.id);

              return (
                <div key={group.id} className='card-modern p-6'>
                  <div className='mb-4'>
                    <h3 className='text-lg font-medium text-foreground flex items-center gap-2'>
                      <Grid3x3 className='w-4 h-4 text-primary' />
                      {group.name}
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      {groupTeams.length} teams •{' '}
                      {group.draw_format || 'round_robin'}
                    </p>
                  </div>

                  <div className='grid gap-3'>
                    {groupTeams.map((team) => {
                      const isSelected = selectedTeams.includes(team.id);
                      const teamLabel = getTeamLabel(team.id);

                      return (
                        <div
                          key={team.id}
                          onClick={() => handleTeamSelect(team.id)}
                          className={`cursor-pointer transition-all p-4 rounded-lg border ${
                            isSelected
                              ? 'ring-2 ring-primary bg-primary/5 border-primary'
                              : 'hover:shadow-md hover:bg-accent/5 border-border'
                          }`}
                        >
                          <div className='flex items-center gap-3'>
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected
                                  ? 'bg-primary text-white'
                                  : 'bg-primary/10'
                              }`}
                            >
                              {isSelected ? (
                                <Check className='h-4 w-4' />
                              ) : (
                                <Users className='h-4 w-4 text-primary' />
                              )}
                            </div>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-1'>
                                <h4 className='font-medium text-foreground'>
                                  {team.name}
                                </h4>
                                {teamLabel && (
                                  <span className='px-2 py-1 bg-primary text-white text-xs rounded-full'>
                                    {teamLabel}
                                  </span>
                                )}
                              </div>
                              {team.description && (
                                <p className='text-muted-foreground text-sm'>
                                  {team.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {groupTeams.length === 0 && (
                      <div className='text-center py-6 text-muted-foreground'>
                        <Users className='h-8 w-8 mx-auto mb-2 opacity-50' />
                        <p className='text-sm'>No teams in this group</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {groups.length === 0 && (
              <div className='text-center py-12'>
                <Grid3x3 className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-xl text-foreground mb-2'>
                  No Groups Available
                </h3>
                <p className='text-muted-foreground'>
                  No groups have been created for this league yet.
                </p>
              </div>
            )}
          </div>
        )}

        {!loading && !hasGroups && allTeams.length > 0 && (
          <div className='space-y-4'>
            <h2 className='text-lg text-foreground mb-6'>Available Teams</h2>
            <div className='grid gap-4'>
              {allTeams.map((team) => {
                const isSelected = selectedTeams.includes(team.id);
                const teamLabel = getTeamLabel(team.id);

                return (
                  <div
                    key={team.id}
                    onClick={() => handleTeamSelect(team.id)}
                    className={`card-modern cursor-pointer transition-all p-6 ${
                      isSelected
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:shadow-lg hover:bg-accent/5'
                    }`}
                  >
                    <div className='flex items-center gap-4'>
                      <div
                        className={`p-3 rounded-lg ${
                          isSelected ? 'bg-primary text-white' : 'bg-primary/10'
                        }`}
                      >
                        {isSelected ? (
                          <Check className='h-6 w-6' />
                        ) : (
                          <Users className='h-6 w-6 text-primary' />
                        )}
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center gap-3 mb-1'>
                          <h3 className='text-xl font-medium text-foreground'>
                            {team.name}
                          </h3>
                          {teamLabel && (
                            <span className='px-2 py-1 bg-primary text-white text-xs rounded-full'>
                              {teamLabel}
                            </span>
                          )}
                        </div>
                        {team.description && (
                          <p className='text-muted-foreground text-sm'>
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {allTeams.length >= 2 && selectedTeams.length < 2 && (
              <div className='mt-8 p-4 bg-muted/20 rounded-lg'>
                <p className='text-sm text-muted-foreground text-center'>
                  Select exactly 2 teams to continue
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSelectionPage;
