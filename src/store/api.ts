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
          select: 'id, name, description, sport_id, status, start_date, end_date, location, organizer_id, max_teams, max_team_members',
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
        endpoint: 'umpire_assigned_leagues',
        method: 'SELECT',
        params: { umpire_id: umpireId },
        options: {
          select: `
            league_id,
            league_name,
            league_description,
            league_status,
            league_start_date,
            league_end_date,
            league_location,
            assigned_at,
            status
          `,
          order: { column: 'league_name', ascending: true },
        },
      }),
      transformResponse: (response: any[]) => {
        return (
          response?.map((item) => ({
            id: item.league_id,
            name: item.league_name,
            description: item.league_description,
            status: item.league_status,
            start_date: item.league_start_date,
            end_date: item.league_end_date,
            location: item.league_location,
            assigned_at: item.assigned_at,
            assignment_status: item.status,
          })) || []
        );
      },
      providesTags: (result, error, umpireId) => [
        { type: 'Leagues', id: `umpire_${umpireId}` },
      ],
    }),

    getUmpireMatches: builder.query<MatchWithDetails[], { umpireId: string; leagueId?: string }>({
      query: ({ umpireId, leagueId }) => ({
        endpoint: 'my_umpire_matches',
        method: 'SELECT',
        params: leagueId ? { league_id: leagueId } : {},
        options: {
          select: `
            match_id,
            league_id,
            league_name,
            category_id,
            category_name,
            match_type,
            team1_id,
            team1_name,
            team2_id,
            team2_name,
            team1_player1_id,
            team1_player1_name,
            team1_player2_id,
            team1_player2_name,
            team2_player1_id,
            team2_player1_name,
            team2_player2_id,
            team2_player2_name,
            status,
            team1_score,
            team2_score,
            team1_game1,
            team1_game2,
            team1_game3,
            team2_game1,
            team2_game2,
            team2_game3,
            is_trump_match,
            court_number,
            scheduled_time,
            start_time,
            completed_at,
            assigned_umpire_id
          `,
          order: { column: 'scheduled_time', ascending: true },
        },
      }),
      transformResponse: (response: any[]) => {
        return (
          response?.map((match) => ({
            id: match.match_id,
            league_id: match.league_id,
            league_name: match.league_name,
            category_id: match.category_id,
            category_name: match.category_name,
            match_type: match.match_type,
            team1_id: match.team1_id,
            team1_name: match.team1_name,
            team2_id: match.team2_id,
            team2_name: match.team2_name,
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
        { type: 'Matches', id: `umpire_${umpireId}_league_${leagueId || 'all'}` },
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
              description,
              match_type
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
            description: item.description || item.tournament_categories?.description,
            match_type: item.tournament_categories?.match_type || 'singles',
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
          select: 'id, league_id, name, description, owner_id, captain_id, status, created_at',
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
              tournament_categories!category_id(name, description, match_type),
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
              tournament_categories!category_id(name, description, match_type),
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
  }),
});

// Export hooks for usage in functional components
export const {
  useGetLeaguesQuery,
  useGetUmpireAssignedLeaguesQuery,
  useGetUmpireMatchesQuery,
  useGetLeagueCategoriesQuery,
  useGetLeagueTeamsQuery,
  useGetLeagueTeamMembersQuery,
  useGetMatchesQuery,
  useGetMatchQuery,
  useCreateMatchMutation,
  useUpdateMatchMutation,
} = api;
