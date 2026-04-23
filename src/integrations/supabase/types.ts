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
      announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          posted_by: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          posted_by: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          posted_by?: string
          title?: string
        }
        Relationships: []
      }
      attendance_logs: {
        Row: {
          check_in_at: string | null
          check_in_lat: number | null
          check_in_lng: number | null
          check_out_at: string | null
          check_out_lat: number | null
          check_out_lng: number | null
          created_at: string
          date: string
          id: string
          is_late: boolean
          is_lop_half_day: boolean
          is_offsite_flagged: boolean
          user_id: string
        }
        Insert: {
          check_in_at?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_out_at?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          created_at?: string
          date: string
          id?: string
          is_late?: boolean
          is_lop_half_day?: boolean
          is_offsite_flagged?: boolean
          user_id: string
        }
        Update: {
          check_in_at?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_out_at?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          created_at?: string
          date?: string
          id?: string
          is_late?: boolean
          is_lop_half_day?: boolean
          is_offsite_flagged?: boolean
          user_id?: string
        }
        Relationships: []
      }
      daily_updates: {
        Row: {
          content: string
          created_at: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          date: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          file_path: string
          id: string
          tag: string | null
          target_user_id: string | null
          title: string
          uploader_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          tag?: string | null
          target_user_id?: string | null
          title: string
          uploader_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          tag?: string | null
          target_user_id?: string | null
          title?: string
          uploader_id?: string
          visibility?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          content: string
          created_at: string
          employee_id: string
          id: string
          manager_id: string
        }
        Insert: {
          content: string
          created_at?: string
          employee_id: string
          id?: string
          manager_id: string
        }
        Update: {
          content?: string
          created_at?: string
          employee_id?: string
          id?: string
          manager_id?: string
        }
        Relationships: []
      }
      leaves: {
        Row: {
          created_at: string
          from_date: string
          half_day: boolean
          id: string
          reason: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["leave_status"]
          to_date: string
          type: Database["public"]["Enums"]["leave_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          from_date: string
          half_day?: boolean
          id?: string
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["leave_status"]
          to_date: string
          type: Database["public"]["Enums"]["leave_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          from_date?: string
          half_day?: boolean
          id?: string
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["leave_status"]
          to_date?: string
          type?: Database["public"]["Enums"]["leave_type"]
          user_id?: string
        }
        Relationships: []
      }
      office_locations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          radius_meters?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          designation: string | null
          email: string
          employee_id: string | null
          full_name: string | null
          id: string
          is_active: boolean
          join_date: string | null
          manager_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email: string
          employee_id?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          join_date?: string | null
          manager_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string
          employee_id?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          join_date?: string | null
          manager_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      responsibilities: {
        Row: {
          assigned_by: string
          created_at: string
          description: string | null
          due_date: string | null
          employee_id: string
          id: string
          status: Database["public"]["Enums"]["responsibility_status"]
          title: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          employee_id: string
          id?: string
          status?: Database["public"]["Enums"]["responsibility_status"]
          title: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          employee_id?: string
          id?: string
          status?: Database["public"]["Enums"]["responsibility_status"]
          title?: string
        }
        Relationships: []
      }
      salary_structures: {
        Row: {
          allowances: Json
          basic: number
          created_at: string
          deductions: Json
          effective_from: string
          hra: number
          id: string
          user_id: string
        }
        Insert: {
          allowances?: Json
          basic?: number
          created_at?: string
          deductions?: Json
          effective_from?: string
          hra?: number
          id?: string
          user_id: string
        }
        Update: {
          allowances?: Json
          basic?: number
          created_at?: string
          deductions?: Json
          effective_from?: string
          hra?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_of: { Args: { _employee_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "employee"
      leave_status: "pending" | "approved" | "rejected"
      leave_type: "CL" | "LOP"
      responsibility_status: "pending" | "in_progress" | "done"
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
      app_role: ["admin", "manager", "employee"],
      leave_status: ["pending", "approved", "rejected"],
      leave_type: ["CL", "LOP"],
      responsibility_status: ["pending", "in_progress", "done"],
    },
  },
} as const
