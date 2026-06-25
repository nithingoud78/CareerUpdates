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
      company_sources: {
        Row: {
          id: string
          company_name: string
          career_url: string
          platform: string | null
          enabled: boolean
          crawl_frequency: string
          last_checked: string | null
          last_success: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          career_url: string
          platform?: string | null
          enabled?: boolean
          crawl_frequency?: string
          last_checked?: string | null
          last_success?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          career_url?: string
          platform?: string | null
          enabled?: boolean
          crawl_frequency?: string
          last_checked?: string | null
          last_success?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      crawl_logs: {
        Row: {
          id: string
          company_source_id: string
          started_at: string
          finished_at: string | null
          jobs_found: number
          jobs_added: number
          duplicates_skipped: number
          failed_jobs: number
          status: string | null
          error_message: string | null
          duration_ms: number | null
          details: Json | null
        }
        Insert: {
          id?: string
          company_source_id: string
          started_at?: string
          finished_at?: string | null
          jobs_found?: number
          jobs_added?: number
          duplicates_skipped?: number
          failed_jobs?: number
          status?: string | null
          error_message?: string | null
          duration_ms?: number | null
          details?: Json | null
        }
        Update: {
          id?: string
          company_source_id?: string
          started_at?: string
          finished_at?: string | null
          jobs_found?: number
          jobs_added?: number
          duplicates_skipped?: number
          failed_jobs?: number
          status?: string | null
          error_message?: string | null
          duration_ms?: number | null
          details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crawl_logs_company_source_id_fkey"
            columns: ["company_source_id"]
            isOneToOne: false
            referencedRelation: "company_sources"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_settings: {
        Row: {
          api_key: string | null
          base_url: string | null
          created_at: string
          id: string
          is_active: boolean
          model: string
          provider: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          model?: string
          provider?: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          model?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          ai_summary: string | null
          apply_url: string
          category: string | null
          company: string
          company_logo: string | null
          created_at: string
          created_by: string | null
          description: string | null
          employment_type: string | null
          experience: string | null
          id: string
          last_date: string | null
          location: string | null
          meta_description: string | null
          posted_date: string
          qualification: string | null
          salary: string | null
          slug: string
          status: Database["public"]["Enums"]["job_status"]
          tags: string[]
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          ai_summary?: string | null
          apply_url: string
          category?: string | null
          company: string
          company_logo?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          employment_type?: string | null
          experience?: string | null
          id?: string
          last_date?: string | null
          location?: string | null
          meta_description?: string | null
          posted_date?: string
          qualification?: string | null
          salary?: string | null
          slug: string
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[]
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          ai_summary?: string | null
          apply_url?: string
          category?: string | null
          company?: string
          company_logo?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          employment_type?: string | null
          experience?: string | null
          id?: string
          last_date?: string | null
          location?: string | null
          meta_description?: string | null
          posted_date?: string
          qualification?: string | null
          salary?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          site_name: string
          contact_email: string | null
          telegram_url: string | null
          whatsapp_url: string | null
          instagram_url: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          site_name?: string
          contact_email?: string | null
          telegram_url?: string | null
          whatsapp_url?: string | null
          instagram_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          site_name?: string
          contact_email?: string | null
          telegram_url?: string | null
          whatsapp_url?: string | null
          instagram_url?: string | null
          updated_at?: string
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
      scheduler_settings: {
        Row: {
          id: number
          is_running: boolean | null
          last_run_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          is_running?: boolean | null
          last_run_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          is_running?: boolean | null
          last_run_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduler_logs: {
        Row: {
          id: string
          started_at: string | null
          finished_at: string | null
          companies_processed: number | null
          companies_skipped: number | null
          companies_failed: number | null
          duration_ms: number | null
          status: string | null
          error_message: string | null
          jobs_added: number | null
          jobs_failed: number | null
        }
        Insert: {
          id?: string
          started_at?: string | null
          finished_at?: string | null
          companies_processed?: number | null
          companies_skipped?: number | null
          companies_failed?: number | null
          duration_ms?: number | null
          status?: string | null
          error_message?: string | null
          jobs_added?: number | null
          jobs_failed?: number | null
        }
        Update: {
          id?: string
          started_at?: string | null
          finished_at?: string | null
          companies_processed?: number | null
          companies_skipped?: number | null
          companies_failed?: number | null
          duration_ms?: number | null
          status?: string | null
          error_message?: string | null
          jobs_added?: number | null
          jobs_failed?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor"
      job_status: "draft" | "published" | "archived"
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
      app_role: ["admin", "editor"],
      job_status: ["draft", "published", "archived"],
    },
  },
} as const
