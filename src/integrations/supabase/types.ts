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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      animal_sightings: {
        Row: {
          animal_id: string
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          notes: string | null
          user_id: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          user_id: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_sightings_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      animals: {
        Row: {
          adoptable: boolean
          adoption_contact: string | null
          city: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string | null
          neighborhood: string | null
          neutered: boolean
          next_vaccine_date: string | null
          photo_url: string | null
          species: string
          street_name: string | null
          updated_at: string
          vaccinated: boolean
        }
        Insert: {
          adoptable?: boolean
          adoption_contact?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string | null
          neighborhood?: string | null
          neutered?: boolean
          next_vaccine_date?: string | null
          photo_url?: string | null
          species: string
          street_name?: string | null
          updated_at?: string
          vaccinated?: boolean
        }
        Update: {
          adoptable?: boolean
          adoption_contact?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string | null
          neighborhood?: string | null
          neutered?: boolean
          next_vaccine_date?: string | null
          photo_url?: string | null
          species?: string
          street_name?: string | null
          updated_at?: string
          vaccinated?: boolean
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          city: string | null
          created_at: string
          created_by: string
          description: string | null
          event_type: string
          id: string
          lat: number
          lng: number
          location_name: string | null
          neighborhood: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          event_type?: string
          id?: string
          lat: number
          lng: number
          location_name?: string | null
          neighborhood?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          event_type?: string
          id?: string
          lat?: number
          lng?: number
          location_name?: string | null
          neighborhood?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      feeding_verifications: {
        Row: {
          created_at: string
          feeding_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feeding_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feeding_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeding_verifications_feeding_id_fkey"
            columns: ["feeding_id"]
            isOneToOne: false
            referencedRelation: "feedings"
            referencedColumns: ["id"]
          },
        ]
      }
      feedings: {
        Row: {
          city: string | null
          created_at: string
          feeding_type: string
          id: string
          lat: number
          lng: number
          neighborhood: string | null
          notes: string | null
          photo_url: string | null
          street_name: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          feeding_type: string
          id?: string
          lat: number
          lng: number
          neighborhood?: string | null
          notes?: string | null
          photo_url?: string | null
          street_name?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          feeding_type?: string
          id?: string
          lat?: number
          lng?: number
          neighborhood?: string | null
          notes?: string | null
          photo_url?: string | null
          street_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      injury_reports: {
        Row: {
          city: string | null
          created_at: string
          description: string
          id: string
          lat: number
          lng: number
          neighborhood: string | null
          photo_url: string | null
          resolved_by: string | null
          severity: string
          status: string
          street_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          description: string
          id?: string
          lat: number
          lng: number
          neighborhood?: string | null
          photo_url?: string | null
          resolved_by?: string | null
          severity: string
          status?: string
          street_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string
          id?: string
          lat?: number
          lng?: number
          neighborhood?: string | null
          photo_url?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          street_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          feeding_count: number
          full_name: string | null
          id: string
          neighborhood: string | null
          rescue_count: number
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          feeding_count?: number
          full_name?: string | null
          id: string
          neighborhood?: string | null
          rescue_count?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          feeding_count?: number
          full_name?: string | null
          id?: string
          neighborhood?: string | null
          rescue_count?: number
          updated_at?: string
          username?: string | null
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
