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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          customer_id: string
          customer_name: string
          customer_since: string | null
        }
        Insert: {
          customer_id?: string
          customer_name: string
          customer_since?: string | null
        }
        Update: {
          customer_id?: string
          customer_name?: string
          customer_since?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          customer_id: string | null
          lead_id: string
          lead_name: string | null
          lead_status: Database["public"]["Enums"]["lead_status_enum"] | null
          lead_value: number | null
          project_id: string | null
          validation_file_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          lead_id?: string
          lead_name?: string | null
          lead_status?: Database["public"]["Enums"]["lead_status_enum"] | null
          lead_value?: number | null
          project_id?: string | null
          validation_file_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          lead_id?: string
          lead_name?: string | null
          lead_status?: Database["public"]["Enums"]["lead_status_enum"] | null
          lead_value?: number | null
          project_id?: string | null
          validation_file_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "leads_validation_file_id_fkey"
            columns: ["validation_file_id"]
            isOneToOne: false
            referencedRelation: "validations"
            referencedColumns: ["validation_file_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          project_customer_id: string | null
          project_id: string
          project_name: string
        }
        Insert: {
          created_at?: string | null
          project_customer_id?: string | null
          project_id?: string
          project_name: string
        }
        Update: {
          created_at?: string | null
          project_customer_id?: string | null
          project_id?: string
          project_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_project_customer_id_fkey"
            columns: ["project_customer_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      validations: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          project_id: string | null
          project_name: string | null
          rev_month: string | null
          revenue: number | null
          sl_no: number
          validation_approval_at: string | null
          validation_file_id: string
          validation_status:
            | Database["public"]["Enums"]["validation_status_enum"]
            | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          project_id?: string | null
          project_name?: string | null
          rev_month?: string | null
          revenue?: number | null
          sl_no?: number
          validation_approval_at?: string | null
          validation_file_id?: string
          validation_status?:
            | Database["public"]["Enums"]["validation_status_enum"]
            | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          project_id?: string | null
          project_name?: string | null
          rev_month?: string | null
          revenue?: number | null
          sl_no?: number
          validation_approval_at?: string | null
          validation_file_id?: string
          validation_status?:
            | Database["public"]["Enums"]["validation_status_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "validations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "validations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_validation_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      lead_status_enum: "Pending" | "In Review" | "Validated" | "Closed"
      validation_status_enum: "Pending" | "Approved" | "Rejected"
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
    Enums: {
      lead_status_enum: ["Pending", "In Review", "Validated", "Closed"],
      validation_status_enum: ["Pending", "Approved", "Rejected"],
    },
  },
} as const
