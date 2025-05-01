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
      agencies: {
        Row: {
          client_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agencies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          agent_connected: boolean | null
          contact_number: string
          created_at: string
          direction: string
          disposition: string | null
          duration: number
          id: string
          lead_id: string
          notes: string | null
          public_share_link: string | null
          timestamp: string
          updated_at: string
        }
        Insert: {
          agent_connected?: boolean | null
          contact_number: string
          created_at?: string
          direction: string
          disposition?: string | null
          duration: number
          id?: string
          lead_id: string
          notes?: string | null
          public_share_link?: string | null
          timestamp: string
          updated_at?: string
        }
        Update: {
          agent_connected?: boolean | null
          contact_number?: string
          created_at?: string
          direction?: string
          disposition?: string | null
          duration?: number
          id?: string
          lead_id?: string
          notes?: string | null
          public_share_link?: string | null
          timestamp?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          gohighlevel_api_key: string | null
          gohighlevel_integrated: boolean
          gohighlevel_location_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gohighlevel_api_key?: string | null
          gohighlevel_integrated?: boolean
          gohighlevel_location_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gohighlevel_api_key?: string | null
          gohighlevel_integrated?: boolean
          gohighlevel_location_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          active: boolean
          agency_id: string | null
          client_id: string | null
          created_at: string
          id: string
          integration_type: string
          settings: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          agency_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          integration_type: string
          settings: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          agency_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          integration_type?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_settings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agency_id: string
          appointment_booked: boolean
          connected: boolean
          contact_id: string | null
          contact_number: string
          created_at: string
          id: string
          location: string
          number_of_calls: number
          number_of_conversations: number
          speed_to_lead: number | null
          time_of_first_call: string | null
          time_of_last_call: string | null
          time_of_notification: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          appointment_booked?: boolean
          connected?: boolean
          contact_id?: string | null
          contact_number: string
          created_at?: string
          id?: string
          location: string
          number_of_calls?: number
          number_of_conversations?: number
          speed_to_lead?: number | null
          time_of_first_call?: string | null
          time_of_last_call?: string | null
          time_of_notification: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          appointment_booked?: boolean
          connected?: boolean
          contact_id?: string | null
          contact_number?: string
          created_at?: string
          id?: string
          location?: string
          number_of_calls?: number
          number_of_conversations?: number
          speed_to_lead?: number | null
          time_of_first_call?: string | null
          time_of_last_call?: string | null
          time_of_notification?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          agency_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_kpis: {
        Row: {
          agency_id: string | null
          booking_rate_target: number
          calls_per_lead_target: number
          client_id: string | null
          connection_rate_target: number
          created_at: string
          id: string
          speed_to_lead_target: number
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          booking_rate_target: number
          calls_per_lead_target: number
          client_id?: string | null
          connection_rate_target: number
          created_at?: string
          id?: string
          speed_to_lead_target: number
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          booking_rate_target?: number
          calls_per_lead_target?: number
          client_id?: string | null
          connection_rate_target?: number
          created_at?: string
          id?: string
          speed_to_lead_target?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_kpis_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_kpis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agency_id: string | null
          client_id: string | null
          created_at: string
          id: string
          name: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          client_id?: string | null
          created_at?: string
          id: string
          name?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_fk"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subaccounts: {
        Row: {
          active: boolean
          agency_id: string
          created_at: string
          email: string
          id: string
          location_id: string
          name: string
          password: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          agency_id: string
          created_at?: string
          email: string
          id?: string
          location_id: string
          name: string
          password: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          agency_id?: string
          created_at?: string
          email?: string
          id?: string
          location_id?: string
          name?: string
          password?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subaccounts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          active: boolean
          agency_id: string | null
          client_id: string | null
          created_at: string
          headers: Json | null
          id: string
          secret: string | null
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          agency_id?: string | null
          client_id?: string | null
          created_at?: string
          headers?: Json | null
          id?: string
          secret?: string | null
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          agency_id?: string | null
          client_id?: string | null
          created_at?: string
          headers?: Json | null
          id?: string
          secret?: string | null
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_call_connection_status: {
        Args: { call_id: string; is_connected: boolean }
        Returns: undefined
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
    Enums: {},
  },
} as const
