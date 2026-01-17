export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      algorithm_predictions: {
        Row: {
          accuracy_rating: number | null
          actual_score_away: number | null
          actual_score_home: number | null
          algorithm_id: string | null
          away_team: string | null
          confidence: number | null
          home_team: string | null
          id: string
          is_live_prediction: boolean | null
          league: string | null
          match_id: string
          match_title: string | null
          predicted_at: string
          prediction: string | null
          projected_score_away: number | null
          projected_score_home: number | null
          result_updated_at: string | null
          status: string
        }
        Insert: {
          accuracy_rating?: number | null
          actual_score_away?: number | null
          actual_score_home?: number | null
          algorithm_id?: string | null
          away_team?: string | null
          confidence?: number | null
          home_team?: string | null
          id?: string
          is_live_prediction?: boolean | null
          league?: string | null
          match_id: string
          match_title?: string | null
          predicted_at?: string
          prediction?: string | null
          projected_score_away?: number | null
          projected_score_home?: number | null
          result_updated_at?: string | null
          status?: string
        }
        Update: {
          accuracy_rating?: number | null
          actual_score_away?: number | null
          actual_score_home?: number | null
          algorithm_id?: string | null
          away_team?: string | null
          confidence?: number | null
          home_team?: string | null
          id?: string
          is_live_prediction?: boolean | null
          league?: string | null
          match_id?: string
          match_title?: string | null
          predicted_at?: string
          prediction?: string | null
          projected_score_away?: number | null
          projected_score_home?: number | null
          result_updated_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "algorithm_predictions_algorithm_id_fkey"
            columns: ["algorithm_id"]
            isOneToOne: false
            referencedRelation: "algorithms"
            referencedColumns: ["id"]
          },
        ]
      }
      algorithm_stats: {
        Row: {
          algorithm_id: string
          avg_confidence: number
          correct_predictions: number
          total_predictions: number
          win_rate: number
        }
        Insert: {
          algorithm_id: string
          avg_confidence?: number
          correct_predictions?: number
          total_predictions?: number
          win_rate?: number
        }
        Update: {
          algorithm_id?: string
          avg_confidence?: number
          correct_predictions?: number
          total_predictions?: number
          win_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "algorithm_stats_algorithm_id_fkey"
            columns: ["algorithm_id"]
            isOneToOne: true
            referencedRelation: "algorithms"
            referencedColumns: ["id"]
          },
        ]
      }
      algorithms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      calibration_history: {
        Row: {
          adjusted_algorithms: number | null
          adjusted_bins: number | null
          algorithm_details: Json | null
          avg_confidence_multiplier: number | null
          bin_details: Json | null
          brier_score: number | null
          created_at: string
          id: string
          is_well_calibrated: boolean | null
          mean_absolute_error: number | null
          overall_adjustment_factor: number | null
          overall_health_score: number | null
          overconfident_bins: number | null
          paused_algorithms: number | null
          recorded_at: string
          settled_predictions: number | null
          total_algorithms: number | null
          total_bins: number | null
          total_predictions: number | null
          underconfident_bins: number | null
        }
        Insert: {
          adjusted_algorithms?: number | null
          adjusted_bins?: number | null
          algorithm_details?: Json | null
          avg_confidence_multiplier?: number | null
          bin_details?: Json | null
          brier_score?: number | null
          created_at?: string
          id?: string
          is_well_calibrated?: boolean | null
          mean_absolute_error?: number | null
          overall_adjustment_factor?: number | null
          overall_health_score?: number | null
          overconfident_bins?: number | null
          paused_algorithms?: number | null
          recorded_at?: string
          settled_predictions?: number | null
          total_algorithms?: number | null
          total_bins?: number | null
          total_predictions?: number | null
          underconfident_bins?: number | null
        }
        Update: {
          adjusted_algorithms?: number | null
          adjusted_bins?: number | null
          algorithm_details?: Json | null
          avg_confidence_multiplier?: number | null
          bin_details?: Json | null
          brier_score?: number | null
          created_at?: string
          id?: string
          is_well_calibrated?: boolean | null
          mean_absolute_error?: number | null
          overall_adjustment_factor?: number | null
          overall_health_score?: number | null
          overconfident_bins?: number | null
          paused_algorithms?: number | null
          recorded_at?: string
          settled_predictions?: number | null
          total_algorithms?: number | null
          total_bins?: number | null
          total_predictions?: number | null
          underconfident_bins?: number | null
        }
        Relationships: []
      }
      line_movement_tracking: {
        Row: {
          alerts_sent: boolean
          current_odds: Json
          detected_at: string
          id: string
          league: string | null
          market_type: string
          match_id: string
          match_title: string | null
          movement_direction: string | null
          movement_percentage: number | null
          previous_odds: Json
          sportsbook_id: string
        }
        Insert: {
          alerts_sent?: boolean
          current_odds: Json
          detected_at?: string
          id?: string
          league?: string | null
          market_type?: string
          match_id: string
          match_title?: string | null
          movement_direction?: string | null
          movement_percentage?: number | null
          previous_odds: Json
          sportsbook_id: string
        }
        Update: {
          alerts_sent?: boolean
          current_odds?: Json
          detected_at?: string
          id?: string
          league?: string | null
          market_type?: string
          match_id?: string
          match_title?: string | null
          movement_direction?: string | null
          movement_percentage?: number | null
          previous_odds?: Json
          sportsbook_id?: string
        }
        Relationships: []
      }
      odds_history: {
        Row: {
          away_odds: number | null
          created_at: string | null
          draw_odds: number | null
          home_odds: number | null
          id: string
          league: string | null
          market_type: string
          match_id: string
          match_title: string | null
          over_odds: number | null
          recorded_at: string | null
          sportsbook_id: string
          sportsbook_name: string
          spread_away: number | null
          spread_away_odds: number | null
          spread_home: number | null
          spread_home_odds: number | null
          total_line: number | null
          under_odds: number | null
        }
        Insert: {
          away_odds?: number | null
          created_at?: string | null
          draw_odds?: number | null
          home_odds?: number | null
          id?: string
          league?: string | null
          market_type?: string
          match_id: string
          match_title?: string | null
          over_odds?: number | null
          recorded_at?: string | null
          sportsbook_id: string
          sportsbook_name: string
          spread_away?: number | null
          spread_away_odds?: number | null
          spread_home?: number | null
          spread_home_odds?: number | null
          total_line?: number | null
          under_odds?: number | null
        }
        Update: {
          away_odds?: number | null
          created_at?: string | null
          draw_odds?: number | null
          home_odds?: number | null
          id?: string
          league?: string | null
          market_type?: string
          match_id?: string
          match_title?: string | null
          over_odds?: number | null
          recorded_at?: string | null
          sportsbook_id?: string
          sportsbook_name?: string
          spread_away?: number | null
          spread_away_odds?: number | null
          spread_home?: number | null
          spread_home_odds?: number | null
          total_line?: number | null
          under_odds?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          preferences: Json | null
          subscription_status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          preferences?: Json | null
          subscription_status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          preferences?: Json | null
          subscription_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          subscription: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscription: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          subscription?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_tracking: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      scheduled_job_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_name: string
          metadata: Json | null
          records_processed: number | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_name: string
          metadata?: Json | null
          records_processed?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_name?: string
          metadata?: Json | null
          records_processed?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      sharp_money_predictions: {
        Row: {
          actual_score_away: number | null
          actual_score_home: number | null
          away_team: string
          beat_closing_line: boolean | null
          closing_line: number | null
          confidence: number
          created_at: string
          detected_at: string
          detection_line: number | null
          game_result: string | null
          game_start_time: string | null
          home_team: string
          id: string
          league: string
          market_type: string
          match_id: string
          match_title: string
          opening_line: number | null
          public_pct_at_detection: number | null
          result_verified_at: string | null
          sharp_pct_at_detection: number | null
          sharp_side: string
          signal_strength: string
          signal_type: string
          updated_at: string
        }
        Insert: {
          actual_score_away?: number | null
          actual_score_home?: number | null
          away_team: string
          beat_closing_line?: boolean | null
          closing_line?: number | null
          confidence?: number
          created_at?: string
          detected_at?: string
          detection_line?: number | null
          game_result?: string | null
          game_start_time?: string | null
          home_team: string
          id?: string
          league: string
          market_type?: string
          match_id: string
          match_title: string
          opening_line?: number | null
          public_pct_at_detection?: number | null
          result_verified_at?: string | null
          sharp_pct_at_detection?: number | null
          sharp_side: string
          signal_strength?: string
          signal_type: string
          updated_at?: string
        }
        Update: {
          actual_score_away?: number | null
          actual_score_home?: number | null
          away_team?: string
          beat_closing_line?: boolean | null
          closing_line?: number | null
          confidence?: number
          created_at?: string
          detected_at?: string
          detection_line?: number | null
          game_result?: string | null
          game_start_time?: string | null
          home_team?: string
          id?: string
          league?: string
          market_type?: string
          match_id?: string
          match_title?: string
          opening_line?: number | null
          public_pct_at_detection?: number | null
          result_verified_at?: string | null
          sharp_pct_at_detection?: number | null
          sharp_side?: string
          signal_strength?: string
          signal_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_tier: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_tier?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_tier?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string
          feature_name: string
          id: string
          updated_at: string
          usage_count: number
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_name: string
          id?: string
          updated_at?: string
          usage_count?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature_name?: string
          id?: string
          updated_at?: string
          usage_count?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      user_alerts: {
        Row: {
          bet_id: string | null
          created_at: string
          id: string
          is_read: boolean
          match_id: string | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          bet_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          match_id?: string | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          bet_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          match_id?: string | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_bets: {
        Row: {
          bet_type: string
          closing_odds: number | null
          clv_percentage: number | null
          created_at: string | null
          game_started_at: string | null
          graded_at: string | null
          id: string
          kelly_stake_recommended: number | null
          league: string | null
          match_id: string
          match_title: string
          model_confidence: number | null
          model_ev_percentage: number | null
          notes: string | null
          odds_at_placement: number
          opening_odds: number | null
          placed_at: string | null
          potential_payout: number
          result_profit: number | null
          selection: string
          settled_at: string | null
          sportsbook: string | null
          stake: number
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bet_type: string
          closing_odds?: number | null
          clv_percentage?: number | null
          created_at?: string | null
          game_started_at?: string | null
          graded_at?: string | null
          id?: string
          kelly_stake_recommended?: number | null
          league?: string | null
          match_id: string
          match_title: string
          model_confidence?: number | null
          model_ev_percentage?: number | null
          notes?: string | null
          odds_at_placement: number
          opening_odds?: number | null
          placed_at?: string | null
          potential_payout: number
          result_profit?: number | null
          selection: string
          settled_at?: string | null
          sportsbook?: string | null
          stake: number
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bet_type?: string
          closing_odds?: number | null
          clv_percentage?: number | null
          created_at?: string | null
          game_started_at?: string | null
          graded_at?: string | null
          id?: string
          kelly_stake_recommended?: number | null
          league?: string | null
          match_id?: string
          match_title?: string
          model_confidence?: number | null
          model_ev_percentage?: number | null
          notes?: string | null
          odds_at_placement?: number
          opening_odds?: number | null
          placed_at?: string | null
          potential_payout?: number
          result_profit?: number | null
          selection?: string
          settled_at?: string | null
          sportsbook?: string | null
          stake?: number
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_betting_stats: {
        Row: {
          avg_clv: number | null
          avg_odds: number | null
          best_streak: number | null
          current_streak: number | null
          id: string
          last_updated: string | null
          losses: number | null
          pending_bets: number | null
          pushes: number | null
          roi_percentage: number | null
          total_bets: number | null
          total_profit: number | null
          total_staked: number | null
          user_id: string
          wins: number | null
        }
        Insert: {
          avg_clv?: number | null
          avg_odds?: number | null
          best_streak?: number | null
          current_streak?: number | null
          id?: string
          last_updated?: string | null
          losses?: number | null
          pending_bets?: number | null
          pushes?: number | null
          roi_percentage?: number | null
          total_bets?: number | null
          total_profit?: number | null
          total_staked?: number | null
          user_id: string
          wins?: number | null
        }
        Update: {
          avg_clv?: number | null
          avg_odds?: number | null
          best_streak?: number | null
          current_streak?: number | null
          id?: string
          last_updated?: string | null
          losses?: number | null
          pending_bets?: number | null
          pushes?: number | null
          roi_percentage?: number | null
          total_bets?: number | null
          total_profit?: number | null
          total_staked?: number | null
          user_id?: string
          wins?: number | null
        }
        Relationships: []
      }
      venue_coordinates: {
        Row: {
          capacity: number | null
          city: string
          country: string | null
          created_at: string
          id: string
          is_outdoor: boolean
          latitude: number
          league: string
          longitude: number
          state: string | null
          team_name: string
          updated_at: string
          venue_name: string
        }
        Insert: {
          capacity?: number | null
          city: string
          country?: string | null
          created_at?: string
          id?: string
          is_outdoor?: boolean
          latitude: number
          league: string
          longitude: number
          state?: string | null
          team_name: string
          updated_at?: string
          venue_name: string
        }
        Update: {
          capacity?: number | null
          city?: string
          country?: string | null
          created_at?: string
          id?: string
          is_outdoor?: boolean
          latitude?: number
          league?: string
          longitude?: number
          state?: string | null
          team_name?: string
          updated_at?: string
          venue_name?: string
        }
        Relationships: []
      }
      weather_cache: {
        Row: {
          condition: string
          condition_description: string | null
          created_at: string
          expires_at: string
          feels_like: number | null
          fetched_at: string
          humidity: number | null
          id: string
          is_outdoor_playable: boolean | null
          latitude: number | null
          longitude: number | null
          precipitation: number | null
          pressure: number | null
          temperature: number
          temperature_celsius: number
          uv_index: number | null
          venue_key: string
          visibility: number | null
          wind_direction: string | null
          wind_gust: number | null
          wind_speed: number | null
        }
        Insert: {
          condition: string
          condition_description?: string | null
          created_at?: string
          expires_at?: string
          feels_like?: number | null
          fetched_at?: string
          humidity?: number | null
          id?: string
          is_outdoor_playable?: boolean | null
          latitude?: number | null
          longitude?: number | null
          precipitation?: number | null
          pressure?: number | null
          temperature: number
          temperature_celsius: number
          uv_index?: number | null
          venue_key: string
          visibility?: number | null
          wind_direction?: string | null
          wind_gust?: number | null
          wind_speed?: number | null
        }
        Update: {
          condition?: string
          condition_description?: string | null
          created_at?: string
          expires_at?: string
          feels_like?: number | null
          fetched_at?: string
          humidity?: number | null
          id?: string
          is_outdoor_playable?: boolean | null
          latitude?: number | null
          longitude?: number | null
          precipitation?: number | null
          pressure?: number | null
          temperature?: number
          temperature_celsius?: number
          uv_index?: number | null
          venue_key?: string
          visibility?: number | null
          wind_direction?: string | null
          wind_gust?: number | null
          wind_speed?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      clv_leaderboard: {
        Row: {
          avatar_url: string | null
          avg_clv: number | null
          best_clv: number | null
          display_name: string | null
          full_name: string | null
          median_clv: number | null
          positive_clv_bets: number | null
          positive_clv_rate: number | null
          roi_percentage: number | null
          total_bets_with_clv: number | null
          total_profit: number | null
          user_id: string | null
          worst_clv: number | null
        }
        Relationships: []
      }
      cron_job_status: {
        Row: {
          active: boolean | null
          command: string | null
          jobid: number | null
          jobname: string | null
          nodename: string | null
          schedule: string | null
        }
        Insert: {
          active?: boolean | null
          command?: string | null
          jobid?: number | null
          jobname?: string | null
          nodename?: string | null
          schedule?: string | null
        }
        Update: {
          active?: boolean | null
          command?: string | null
          jobid?: number | null
          jobname?: string | null
          nodename?: string | null
          schedule?: string | null
        }
        Relationships: []
      }
      sharp_money_stats: {
        Row: {
          avg_confidence: number | null
          beat_closing_count: number | null
          clv_rate: number | null
          league: string | null
          losses: number | null
          market_type: string | null
          pending: number | null
          pushes: number | null
          signal_strength: string | null
          signal_type: string | null
          total_predictions: number | null
          win_rate: number | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      clean_expired_weather_cache: { Args: never; Returns: undefined }
      cleanup_old_job_logs: { Args: never; Returns: number }
      cleanup_old_odds_history: { Args: never; Returns: undefined }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      get_clv_leaderboard: {
        Args: never
        Returns: {
          avg_clv: number
          best_clv: number
          display_name: string
          is_current_user: boolean
          median_clv: number
          positive_clv_bets: number
          positive_clv_rate: number
          rank_position: number
          roi_percentage: number
          total_bets_with_clv: number
          total_profit: number
          worst_clv: number
        }[]
      }
      get_cron_job_status: {
        Args: never
        Returns: {
          active: boolean
          jobname: string
          schedule: string
        }[]
      }
      get_daily_usage: {
        Args: { p_feature_name: string; p_user_id: string }
        Returns: number
      }
      get_user_preferences: { Args: { user_id_param: string }; Returns: Json }
      increment_usage: {
        Args: { p_feature_name: string; p_user_id: string }
        Returns: number
      }
      manual_record_odds: { Args: never; Returns: Json }
      recalculate_user_betting_stats: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      trigger_grade_predictions: { Args: never; Returns: undefined }
      trigger_record_odds: { Args: never; Returns: undefined }
      trigger_save_predictions: { Args: never; Returns: undefined }
      update_user_preference: {
        Args: {
          new_value: Json
          preference_path: string[]
          user_id_param: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
