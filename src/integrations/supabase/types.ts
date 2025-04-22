export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      algorithm_predictions: {
        Row: {
          algorithm_id: string
          confidence: number
          id: string
          league: string
          match_id: string
          metadata: Json | null
          predicted_at: string
          prediction: string
          result_updated_at: string | null
          status: string
        }
        Insert: {
          algorithm_id: string
          confidence: number
          id?: string
          league: string
          match_id: string
          metadata?: Json | null
          predicted_at?: string
          prediction: string
          result_updated_at?: string | null
          status?: string
        }
        Update: {
          algorithm_id?: string
          confidence?: number
          id?: string
          league?: string
          match_id?: string
          metadata?: Json | null
          predicted_at?: string
          prediction?: string
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
      algorithms: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      injury_reports: {
        Row: {
          created_at: string
          details: string | null
          expected_return: string | null
          id: string
          player_external_id: string
          player_name: string
          status: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          expected_return?: string | null
          id?: string
          player_external_id: string
          player_name: string
          status: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          expected_return?: string | null
          id?: string
          player_external_id?: string
          player_name?: string
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "injury_reports_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          created_at: string
          external_id: string
          home_score: number | null
          home_team_id: string | null
          id: string
          sport: Database["public"]["Enums"]["sport_type"]
          start_time: string
          status: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string
          external_id: string
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          sport: Database["public"]["Enums"]["sport_type"]
          start_time: string
          status?: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          created_at?: string
          external_id?: string
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          sport?: Database["public"]["Enums"]["sport_type"]
          start_time?: string
          status?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      odds: {
        Row: {
          away_odds: number | null
          bookmaker: string
          created_at: string
          draw_odds: number | null
          home_odds: number | null
          id: string
          last_updated: string
          match_id: string | null
        }
        Insert: {
          away_odds?: number | null
          bookmaker: string
          created_at?: string
          draw_odds?: number | null
          home_odds?: number | null
          id?: string
          last_updated?: string
          match_id?: string | null
        }
        Update: {
          away_odds?: number | null
          bookmaker?: string
          created_at?: string
          draw_odds?: number | null
          home_odds?: number | null
          id?: string
          last_updated?: string
          match_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "odds_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          created_at: string
          id: string
          match_id: string | null
          player_external_id: string
          player_name: string
          stats: Json
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id?: string | null
          player_external_id: string
          player_name: string
          stats?: Json
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string | null
          player_external_id?: string
          player_name?: string
          stats?: Json
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          external_id: string
          id: string
          logo_url: string | null
          name: string
          short_name: string | null
          sport: Database["public"]["Enums"]["sport_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id: string
          id?: string
          logo_url?: string | null
          name: string
          short_name?: string | null
          sport: Database["public"]["Enums"]["sport_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string
          id?: string
          logo_url?: string | null
          name?: string
          short_name?: string | null
          sport?: Database["public"]["Enums"]["sport_type"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      sport_type: "football" | "basketball" | "baseball" | "hockey" | "soccer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      sport_type: ["football", "basketball", "baseball", "hockey", "soccer"],
    },
  },
} as const
