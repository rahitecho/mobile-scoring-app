// Core types for mobile scoring app - simplified from main project types

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'player' | 'umpire' | 'guest' | 'organizer';
  dupr_id?: string;
  dupr_player_data?: {
    ratings?: {
      singles?: string | null;
      doubles?: string | null;
      singlesReliabilityScore?: number;
      doublesReliabilityScore?: number;
    };
  } | null;
}

export interface League {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  organizer_id?: string;
  sport_id?: string;
  max_teams: number;
  max_team_members: number;
  registration_deadline?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  image_url?: string;
  payment_link?: string;
  registration_fee?: number; // in paisa
  winning_amount?: number;
  terms_and_conditions?: string;
  razorpay_key?: string;
  razorpay_secret?: string;
  created_at: string;
  updated_at: string;
}

export interface LeagueCategory {
  id: string;
  league_id: string;
  category_id?: string;
  name?: string;
  description?: string;
  match_type?: 'singles' | 'doubles';
  win_points?: number;
  created_at?: string;
  updated_at?: string;
}

export interface LeagueTeam {
  id: string;
  league_id: string;
  name: string;
  description?: string;
  owner_id?: string;
  captain_id?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface LeagueTeamMember {
  id: string;
  team_id: string;
  player_id: string;
  role: 'owner' | 'captain' | 'player';
  joined_date: string;
  status: 'active' | 'inactive' | 'removed';
  created_at: string;
  updated_at: string;
  player?: User;
}

export interface Match {
  id: string;

  // Context - league match
  league_id: string;
  category_id: string;

  // Team references
  team1_id: string;
  team2_id: string;

  match_type: 'singles' | 'doubles';

  // Team players (can be set later by team captains)
  team1_player1_id?: string | null;
  team1_player2_id?: string | null;
  team2_player1_id?: string | null;
  team2_player2_id?: string | null;

  // Match details
  status: 'pending' | 'in_progress' | 'completed';
  team1_score: number;
  team2_score: number;

  // Game scoring (DUPR style)
  team1_game1?: number;
  team1_game2?: number;
  team1_game3?: number;
  team2_game1?: number;
  team2_game2?: number;
  team2_game3?: number;

  // Trump match for bonus points
  is_trump_match: boolean;

  // Scheduling
  court_number?: number | null;
  scheduled_time?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  completed_at?: string | null;

  created_at: string;
  updated_at: string;
}

export interface MatchWithDetails extends Match {
  // League details
  league_name?: string;
  category_name?: string;
  league_group_id?: string;

  // Team details
  team1_name?: string;
  team2_name?: string;

  // Player details
  team1_player1_name?: string;
  team1_player1_dupr?: number;
  team1_player2_name?: string;
  team1_player2_dupr?: number;
  team2_player1_name?: string;
  team2_player1_dupr?: number;
  team2_player2_name?: string;
  team2_player2_dupr?: number;
}

export interface CreateMatchRequest {
  league_id: string;
  category_id: string;
  team1_id: string;
  team2_id: string;
  match_type: 'singles' | 'doubles';
  // Player IDs are optional - can be set later by team captains
  team1_player1_id?: string | null;
  team1_player2_id?: string | null;
  team2_player1_id?: string | null;
  team2_player2_id?: string | null;
  is_trump_match?: boolean;
  court_number?: number | null;
  scheduled_time?: string;
  assigned_umpire_id?: string;
  league_group_id: string;
}

export interface UpdateMatchScoreRequest {
  id: string;
  status?: 'pending' | 'in_progress' | 'completed';
  team1_score?: number;
  team2_score?: number;
  team1_game1?: number;
  team1_game2?: number;
  team1_game3?: number;
  team2_game1?: number;
  team2_game2?: number;
  team2_game3?: number;
  completed_at?: string;
  league_group_id?: string;
}
