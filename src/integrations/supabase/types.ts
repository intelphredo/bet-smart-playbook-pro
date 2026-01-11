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
          confidence: number | null
          id: string
          league: string | null
          match_id: string
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
          confidence?: number | null
          id?: string
          league?: string | null
          match_id: string
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
          confidence?: number | null
          id?: string
          league?: string | null
          match_id?: string
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
    }
    Functions: {
      clean_expired_weather_cache: { Args: never; Returns: undefined }
      cleanup_old_odds_history: { Args: never; Returns: undefined }
      get_user_preferences: { Args: { user_id_param: string }; Returns: Json }
      manual_record_odds: { Args: never; Returns: Json }
      recalculate_user_betting_stats: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      trigger_record_odds: { Args: never; Returns: undefined }
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
