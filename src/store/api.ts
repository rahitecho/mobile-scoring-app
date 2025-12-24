import { createApi } from '@reduxjs/toolkit/query/react';
import { supabaseBaseQuery } from './supabaseBaseQuery';
import type {
  League,
  LeagueCategory,
  LeagueTeam,
  LeagueTeamMember,
  Match,
  MatchWithDetails,
  CreateMatchRequest,
  UpdateMatchScoreRequest,
} from '@/types';

export const api = createApi({
  reducerPath: 'mobileApi',
  baseQuery: supabaseBaseQuery,
  tagTypes: [
    'Leagues',
    'LeagueCategories',
    'LeagueTeams',
    'LeagueTeamMembers',
    'Matches',
    'Umpires',
    'UmpireLeagueAssignments',
  ],
  endpoints: (builder) => ({
    // ====================================
    // LEAGUES ENDPOINTS
    // ====================================
    getLeagues: builder.query<League[], void>({
      query: () => ({
        endpoint: 'leagues',
        method: 'SELECT',
        options: {
          select:
            'id, name, description, sport_id, status, start_date, end_date, location, organizer_id, max_teams, max_team_members',
          order: { column: 'name', ascending: true },
        },
        params: {
          status: 'in.(upcoming,ongoing)', // Get leagues that are active for scoring
        },
      }),
      providesTags: ['Leagues'],
    }),

    // ====================================
    // UMPIRE-SPECIFIC ENDPOINTS
    // ====================================
    getUmpireAssignedLeagues: builder.query<League[], string>({
      query: (umpireId) => ({
        endpoint: 'umpire_league_assignments',
        method: 'SELECT',
        params: {
          umpire_id: umpireId,
          status: 'active',
        },
        options: {
          select: `
            id,
            league_id,
            umpire_id,
            assigned_at,
            status,
            leagues!league_id(
              id,
              name,
              description,
              status,
              start_date,
              end_date,
              location,
              organizer_id,
              max_teams,
              max_team_members
            )
          `,
          order: { column: 'assigned_at', ascending: false },
        },
      }),
      transformResponse: (response: any[]) => {
        return (
          response
            ?.map((assignment) => ({
              id: assignment.leagues?.id,
              name: assignment.leagues?.name,
              description: assignment.leagues?.description,
              status: assignment.leagues?.status,
              start_date: assignment.leagues?.start_date,
              end_date: assignment.leagues?.end_date,
              location: assignment.leagues?.location,
              organizer_id: assignment.leagues?.organizer_id,
              max_teams: assignment.leagues?.max_teams,
              max_team_members: assignment.leagues?.max_team_members,
              assigned_at: assignment.assigned_at,
              assignment_status: assignment.status,
            }))
            .filter((league) => league.id) || [] // Filter out any null leagues
        );
      },
      providesTags: (result, error, umpireId) => [
        { type: 'Leagues', id: `umpire_${umpireId}` },
      ],
    }),

    getUmpireMatches: builder.query<
      MatchWithDetails[],
      { umpireId: string; leagueId?: string }
    >({
      query: ({ umpireId, leagueId }) => ({
        endpoint: 'my_umpire_matches',
        method: 'SELECT',
        params: leagueId ? { league_id: leagueId } : {},
        options: {
          select:
            'id,league_id,league_name,category_id,tournament_category_name,match_type,team1_id,league_team1_name,team2_id,league_team2_name,team1_player1_id,team1_player1_name,team1_player2_id,team1_player2_name,team2_player1_id,team2_player1_name,team2_player2_id,team2_player2_name,status,team1_score,team2_score,team1_game1,team1_game2,team1_game3,team2_game1,team2_game2,team2_game3,is_trump_match,court_number,scheduled_time,start_time,completed_at,assigned_umpire_id',
          order: { column: 'scheduled_time', ascending: true },
        },
      }),
      transformResponse: (response: any[]) => {
        return (
          response?.map((match) => ({
            id: match.id,
            league_id: match.league_id,
            league_name: match.league_name,
            category_id: match.category_id,
            category_name: match.tournament_category_name,
            match_type: match.match_type,
            team1_id: match.team1_id,
            team1_name: match.league_team1_name,
            team2_id: match.team2_id,
            team2_name: match.league_team2_name,
            team1_player1_id: match.team1_player1_id,
            team1_player1_name: match.team1_player1_name,
            team1_player2_id: match.team1_player2_id,
            team1_player2_name: match.team1_player2_name,
            team2_player1_id: match.team2_player1_id,
            team2_player1_name: match.team2_player1_name,
            team2_player2_id: match.team2_player2_id,
            team2_player2_name: match.team2_player2_name,
            status: match.status,
            team1_score: match.team1_score || 0,
            team2_score: match.team2_score || 0,
            team1_game1: match.team1_game1,
            team1_game2: match.team1_game2,
            team1_game3: match.team1_game3,
            team2_game1: match.team2_game1,
            team2_game2: match.team2_game2,
            team2_game3: match.team2_game3,
            is_trump_match: match.is_trump_match || false,
            court_number: match.court_number,
            scheduled_time: match.scheduled_time,
            start_time: match.start_time,
            completed_at: match.completed_at,
            assigned_umpire_id: match.assigned_umpire_id,
          })) || []
        );
      },
      providesTags: (result, error, { umpireId, leagueId }) => [
        {
          type: 'Matches',
          id: `umpire_${umpireId}_league_${leagueId || 'all'}`,
        },
      ],
    }),

    // ====================================
    // LEAGUE GROUPS ENDPOINTS
    // ====================================
    getLeagueGroups: builder.query<any[], { league_id: string }>({
      query: ({ league_id }) => ({
        endpoint: 'league_groups',
        method: 'SELECT',
        params: { league_id },
        options: {
          select:
            'id, name, group_number, draw_format, status, max_teams, created_at',
          order: { column: 'group_number', ascending: true },
        },
      }),
      providesTags: (result, error, { league_id }) => [
        { type: 'LeagueCategories', id: `groups_${league_id}` },
      ],
    }),

    getLeagueGroupTeams: builder.query<any[], { league_id: string }>({
      query: ({ league_id }) => ({
        endpoint: 'league_group_standings_view',
        method: 'SELECT',
        params: { league_id },
        options: {
          select: `
            id,
            group_id,
            team_id,
            team_name,
            seed,
            position,
            matches_played,
            matches_won,
            matches_lost,
            matches_drawn,
            games_won,
            games_lost,
            points_for,
            points_against,
            points_differential,
            win_percentage
          `,
          order: { column: 'seed', ascending: true },
        },
      }),
      transformResponse: (response: any[]) => {
        return (
          response?.map((groupTeam) => ({
            id: groupTeam.id,
            group_id: groupTeam.group_id,
            team_id: groupTeam.team_id,
            team_name: groupTeam.team_name,
            seed: groupTeam.seed,
            position: groupTeam.position,
            matches_played: groupTeam.matches_played || 0,
            matches_won: groupTeam.matches_won || 0,
            matches_lost: groupTeam.matches_lost || 0,
            matches_drawn: groupTeam.matches_drawn || 0,
            points_for: groupTeam.points_for || 0,
            points_against: groupTeam.points_against || 0,
            points_differential: groupTeam.points_differential || 0,
            team: groupTeam.league_teams,
          })) || []
        );
      },
      providesTags: (result, error, { league_id }) => [
        { type: 'LeagueTeams', id: `group_teams_${league_id}` },
      ],
    }),

    // ====================================
    // LEAGUE CATEGORY SETTINGS ENDPOINTS
    // ====================================
    getLeagueCategories: builder.query<LeagueCategory[], string>({
      query: (leagueId) => ({
        endpoint: 'league_category_settings',
        method: 'SELECT',
        params: { league_id: leagueId },
        options: {
          select: `
            id,
            league_id,
            category_id,
            description,
            win_points,
            tournament_categories!category_id(
              id,
              name,
              description
            )
          `,
          order: { column: 'created_at', ascending: true },
        },
      }),
      transformResponse: (response: any[]) => {
        return (
          response?.map((item) => ({
            id: item.id,
            league_id: item.league_id,
            category_id: item.category_id,
            name: item.tournament_categories?.name || 'Unknown Category',
            description:
              item.description || item.tournament_categories?.description,
            match_type: 'singles', // Default to singles since match_type is not stored in tournament_categories
            win_points: item.win_points || 0,
          })) || []
        );
      },
      providesTags: (result, error, leagueId) => [
        { type: 'LeagueCategories', id: leagueId },
      ],
    }),

    // ====================================
    // LEAGUE TEAMS ENDPOINTS
    // ====================================
    getLeagueTeams: builder.query<LeagueTeam[], string>({
      query: (leagueId) => ({
        endpoint: 'league_teams',
        method: 'SELECT',
        params: {
          league_id: leagueId,
          status: 'active',
        },
        options: {
          select:
            'id, league_id, name, description, owner_id, captain_id, status, created_at',
          order: { column: 'name', ascending: true },
        },
      }),
      providesTags: (result, error, leagueId) => [
        { type: 'LeagueTeams', id: leagueId },
      ],
    }),

    // ====================================
    // LEAGUE TEAM MEMBERS ENDPOINTS
    // ====================================
    getLeagueTeamMembers: builder.query<LeagueTeamMember[], string>({
      query: (teamId) => ({
        endpoint: 'league_team_members',
        method: 'SELECT',
        params: {
          team_id: teamId,
          status: 'active',
        },
        options: {
          select: `
            id,
            team_id,
            player_id,
            role,
            status,
            player:profiles(
              id,
              name,
              email,
              dupr_id,
              dupr_player_data
            )
          `,
          order: { column: 'role', ascending: false }, // captains first
        },
      }),
      providesTags: (result, error, teamId) => [
        { type: 'LeagueTeamMembers', id: teamId },
      ],
    }),

    // ====================================
    // MATCHES ENDPOINTS
    // ====================================
    getMatches: builder.query<MatchWithDetails[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery({
          endpoint: 'matches',
          method: 'SELECT',
          options: {
            select: `
              *,
              league:leagues(name),
              tournament_categories!category_id(name, description),
              team1:league_teams!team1_id(name),
              team2:league_teams!team2_id(name),
              team1_player1:profiles!team1_player1_id(name, dupr_player_data),
              team1_player2:profiles!team1_player2_id(name, dupr_player_data),
              team2_player1:profiles!team2_player1_id(name, dupr_player_data),
              team2_player2:profiles!team2_player2_id(name, dupr_player_data)
            `,
            order: { column: 'created_at', ascending: false },
            operators: {
              league_id: 'is',
            },
          },
          params: {
            league_id: 'not.null', // Only league matches
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        // Transform the data to include computed fields
        const transformedData = (result.data as any[])?.map((match: any) => ({
          ...match,
          league_name: match.league?.name,
          category_name: match.tournament_categories?.name,
          team1_name: match.team1?.name,
          team2_name: match.team2?.name,
          team1_player1_name: match.team1_player1?.name,
          team1_player1_dupr: match.team1_player1?.dupr_player_data?.ratings
            ?.doubles
            ? parseFloat(match.team1_player1.dupr_player_data.ratings.doubles)
            : match.team1_player1?.dupr_player_data?.ratings?.singles
            ? parseFloat(match.team1_player1.dupr_player_data.ratings.singles)
            : undefined,
          team1_player2_name: match.team1_player2?.name,
          team1_player2_dupr: match.team1_player2?.dupr_player_data?.ratings
            ?.doubles
            ? parseFloat(match.team1_player2.dupr_player_data.ratings.doubles)
            : match.team1_player2?.dupr_player_data?.ratings?.singles
            ? parseFloat(match.team1_player2.dupr_player_data.ratings.singles)
            : undefined,
          team2_player1_name: match.team2_player1?.name,
          team2_player1_dupr: match.team2_player1?.dupr_player_data?.ratings
            ?.doubles
            ? parseFloat(match.team2_player1.dupr_player_data.ratings.doubles)
            : match.team2_player1?.dupr_player_data?.ratings?.singles
            ? parseFloat(match.team2_player1.dupr_player_data.ratings.singles)
            : undefined,
          team2_player2_name: match.team2_player2?.name,
          team2_player2_dupr: match.team2_player2?.dupr_player_data?.ratings
            ?.doubles
            ? parseFloat(match.team2_player2.dupr_player_data.ratings.doubles)
            : match.team2_player2?.dupr_player_data?.ratings?.singles
            ? parseFloat(match.team2_player2.dupr_player_data.ratings.singles)
            : undefined,
        }));

        return { data: transformedData };
      },
      providesTags: ['Matches'],
    }),

    getMatch: builder.query<MatchWithDetails, string>({
      async queryFn(matchId, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery({
          endpoint: 'matches',
          method: 'SELECT',
          params: { id: matchId },
          options: {
            single: true,
            select: `
              *,
              league:leagues(name),
              tournament_categories!category_id(name, description),
              team1:league_teams!team1_id(name),
              team2:league_teams!team2_id(name),
              team1_player1:profiles!team1_player1_id(name, dupr_player_data),
              team1_player2:profiles!team1_player2_id(name, dupr_player_data),
              team2_player1:profiles!team2_player1_id(name, dupr_player_data),
              team2_player2:profiles!team2_player2_id(name, dupr_player_data)
            `,
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const match = result.data as any;
        // Transform the data to include computed fields
        const transformedMatch = {
          ...match,
          league_name: match.league?.name,
          category_name: match.tournament_categories?.name,
          team1_name: match.team1?.name,
          team2_name: match.team2?.name,
          team1_player1_name: match.team1_player1?.name,
          team1_player1_dupr: match.team1_player1?.dupr_player_data?.ratings
            ?.doubles
            ? parseFloat(match.team1_player1.dupr_player_data.ratings.doubles)
            : match.team1_player1?.dupr_player_data?.ratings?.singles
            ? parseFloat(match.team1_player1.dupr_player_data.ratings.singles)
            : undefined,
          team1_player2_name: match.team1_player2?.name,
          team1_player2_dupr: match.team1_player2?.dupr_player_data?.ratings
            ?.doubles
            ? parseFloat(match.team1_player2.dupr_player_data.ratings.doubles)
            : match.team1_player2?.dupr_player_data?.ratings?.singles
            ? parseFloat(match.team1_player2.dupr_player_data.ratings.singles)
            : undefined,
          team2_player1_name: match.team2_player1?.name,
          team2_player1_dupr: match.team2_player1?.dupr_player_data?.ratings
            ?.doubles
            ? parseFloat(match.team2_player1.dupr_player_data.ratings.doubles)
            : match.team2_player1?.dupr_player_data?.ratings?.singles
            ? parseFloat(match.team2_player1.dupr_player_data.ratings.singles)
            : undefined,
          team2_player2_name: match.team2_player2?.name,
          team2_player2_dupr: match.team2_player2?.dupr_player_data?.ratings
            ?.doubles
            ? parseFloat(match.team2_player2.dupr_player_data.ratings.doubles)
            : match.team2_player2?.dupr_player_data?.ratings?.singles
            ? parseFloat(match.team2_player2.dupr_player_data.ratings.singles)
            : undefined,
        };

        return { data: transformedMatch };
      },
      providesTags: (result, error, matchId) => [
        { type: 'Matches', id: matchId },
      ],
    }),

    createMatch: builder.mutation<Match, CreateMatchRequest>({
      query: (matchData) => ({
        endpoint: 'matches',
        method: 'INSERT',
        body: {
          // League match fields
          league_id: matchData.league_id,
          category_id: matchData.category_id,
          team1_id: matchData.team1_id,
          team2_id: matchData.team2_id,
          match_type: matchData.match_type,

          // Match settings
          is_trump_match: matchData.is_trump_match || false,
          court_number: matchData.court_number || null,
          scheduled_time: matchData.scheduled_time || new Date().toISOString(),
          assigned_umpire_id: matchData.assigned_umpire_id || null,
          leauge_group_id: matchData.league_group_id || null,

          // Initial scores
          status: 'pending',
          team1_score: 0,
          team2_score: 0,

          // Player IDs (can be set later by team captains)
          team1_player1_id: matchData.team1_player1_id || null,
          team1_player2_id: matchData.team1_player2_id || null,
          team2_player1_id: matchData.team2_player1_id || null,
          team2_player2_id: matchData.team2_player2_id || null,
        },
        options: {
          select: '*',
        },
      }),
      transformResponse: (response: any[]) => {
        return response?.[0];
      },
      invalidatesTags: ['Matches'],
    }),

    updateMatch: builder.mutation<Match, UpdateMatchScoreRequest>({
      query: ({ id, ...updateData }) => ({
        endpoint: 'matches',
        method: 'UPDATE',
        params: { id },
        body: updateData,
        options: {
          returning: true,
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Matches', id },
        'Matches',
      ],
    }),

    // ====================================
    // UMPIRES AND ASSIGNMENTS ENDPOINTS
    // ====================================
    getUmpires: builder.query<any[], void>({
      query: () => ({
        endpoint: 'profiles',
        method: 'SELECT',
        params: {
          role: 'eq.umpire',
        },
        options: {
          select: 'id, name, email, phone, dupr_id, created_at',
          order: { column: 'name', ascending: true },
        },
      }),
      providesTags: ['Umpires'],
    }),

    getUmpireLeagueAssignments: builder.query<any[], string>({
      query: (leagueId) => ({
        endpoint: 'umpire_league_assignments',
        method: 'SELECT',
        params: {
          league_id: leagueId,
          status: 'active',
        },
        options: {
          select: `
            id,
            league_id,
            umpire_id,
            status,
            assigned_at,
            assigned_by,
            profiles!umpire_id(
              id,
              name,
              email,
              phone,
              dupr_id
            )
          `,
          order: { column: 'assigned_at', ascending: false },
        },
      }),
      transformResponse: (response: any[]) => {
        return (
          response?.map((assignment) => ({
            id: assignment.id,
            league_id: assignment.league_id,
            umpire_id: assignment.umpire_id,
            status: assignment.status,
            assigned_at: assignment.assigned_at,
            assigned_by: assignment.assigned_by,
            umpire: assignment.profiles,
          })) || []
        );
      },
      providesTags: (result, error, leagueId) => [
        { type: 'UmpireLeagueAssignments', id: leagueId },
      ],
    }),

    assignUmpiresToLeague: builder.mutation<
      any,
      { leagueId: string; umpireIds: string[] }
    >({
      async queryFn(
        { leagueId, umpireIds },
        _queryApi,
        _extraOptions,
        baseQuery
      ) {
        try {
          // First, get current assignments
          const currentAssignmentsResult = await baseQuery({
            endpoint: 'umpire_league_assignments',
            method: 'SELECT',
            params: {
              league_id: leagueId,
              status: 'active',
            },
            options: {
              select: 'id, umpire_id',
            },
          });

          if (currentAssignmentsResult.error) {
            return { error: currentAssignmentsResult.error };
          }

          const currentAssignments = currentAssignmentsResult.data as any[];
          const currentUmpireIds = currentAssignments.map((a) => a.umpire_id);

          // Find umpires to remove (in current but not in new selection)
          const toRemove = currentAssignments.filter(
            (assignment) => !umpireIds.includes(assignment.umpire_id)
          );

          // Find umpires to add (in new selection but not in current)
          const toAdd = umpireIds.filter(
            (umpireId) => !currentUmpireIds.includes(umpireId)
          );

          // Remove unassigned umpires
          for (const assignment of toRemove) {
            await baseQuery({
              endpoint: 'umpire_league_assignments',
              method: 'UPDATE',
              params: { id: assignment.id },
              body: { status: 'inactive' },
            });
          }

          // Add new umpire assignments
          for (const umpireId of toAdd) {
            await baseQuery({
              endpoint: 'umpire_league_assignments',
              method: 'INSERT',
              body: {
                league_id: leagueId,
                umpire_id: umpireId,
                status: 'active',
                assigned_at: new Date().toISOString(),
              },
            });
          }

          return {
            data: {
              success: true,
              assigned: toAdd.length,
              removed: toRemove.length,
            },
          };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error } };
        }
      },
      invalidatesTags: (result, error, { leagueId }) => [
        { type: 'UmpireLeagueAssignments', id: leagueId },
        'UmpireLeagueAssignments',
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetLeaguesQuery,
  useGetUmpireAssignedLeaguesQuery,
  useGetUmpireMatchesQuery,
  useGetLeagueCategoriesQuery,
  useGetLeagueTeamsQuery,
  useGetLeagueGroupsQuery,
  useGetLeagueGroupTeamsQuery,
  useGetLeagueTeamMembersQuery,
  useGetMatchesQuery,
  useGetMatchQuery,
  useCreateMatchMutation,
  useUpdateMatchMutation,
  useGetUmpiresQuery,
  useGetUmpireLeagueAssignmentsQuery,
  useAssignUmpiresToLeagueMutation,
} = api;
