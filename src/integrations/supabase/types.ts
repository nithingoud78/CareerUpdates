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
      blogs: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          cover_image: string | null
          category: string | null
          tags: string[]
          author: string
          status: 'draft' | 'published'
          featured: boolean
          seo_title: string | null
          seo_description: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          cover_image?: string | null
          category?: string | null
          tags?: string[]
          author?: string
          status?: 'draft' | 'published'
          featured?: boolean
          seo_title?: string | null
          seo_description?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          cover_image?: string | null
          category?: string | null
          tags?: string[]
          author?: string
          status?: 'draft' | 'published'
          featured?: boolean
          seo_title?: string | null
          seo_description?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          id: string
          name: string
          email: string
          subject: string
          message: string
          status: 'Unread' | 'Read'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          subject: string
          message: string
          status?: 'Unread' | 'Read'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          subject?: string
          message?: string
          status?: 'Unread' | 'Read'
          created_at?: string
        }
        Relationships: []
      }
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
          // Ads control (added by 20260901120000_ads_config.sql)
          ads_enabled: boolean
          ads_disabled_at: string | null
          ads_auto_enable_at: string | null
        }
        Insert: {
          id?: string
          site_name?: string
          contact_email?: string | null
          telegram_url?: string | null
          whatsapp_url?: string | null
          instagram_url?: string | null
          updated_at?: string
          ads_enabled?: boolean
          ads_disabled_at?: string | null
          ads_auto_enable_at?: string | null
        }
        Update: {
          id?: string
          site_name?: string
          contact_email?: string | null
          telegram_url?: string | null
          whatsapp_url?: string | null
          instagram_url?: string | null
          updated_at?: string
          ads_enabled?: boolean
          ads_disabled_at?: string | null
          ads_auto_enable_at?: string | null
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
      career_tool_products: {
        Row: {
          id: string
          slug: string
          title: string
          short_description: string | null
          description: string | null
          product_type: 'single_template' | 'bundle'
          resource_type: 'resume' | 'cover_letter' | 'referral_message' | 'cold_email'
          category: string | null
          tags: string[]
          suitable_for: string[]
          features: string[]
          ats_friendly: boolean
          file_format: string | null
          file_url: string | null
          preview_image_url: string | null
          original_price: number
          current_price: number
          status: 'draft' | 'published' | 'archived'
          pinned: boolean
          sort_order: number
          seo_title: string | null
          seo_description: string | null
          og_image: string | null
          source_url: string | null
          license: string | null
          license_url: string | null
          attribution_required: boolean
          attribution_text: string | null
          imported_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          short_description?: string | null
          description?: string | null
          product_type?: 'single_template' | 'bundle'
          resource_type?: 'resume' | 'cover_letter' | 'referral_message' | 'cold_email'
          category?: string | null
          tags?: string[]
          suitable_for?: string[]
          features?: string[]
          ats_friendly?: boolean
          file_format?: string | null
          file_url?: string | null
          preview_image_url?: string | null
          original_price?: number
          current_price?: number
          status?: 'draft' | 'published' | 'archived'
          pinned?: boolean
          sort_order?: number
          seo_title?: string | null
          seo_description?: string | null
          og_image?: string | null
          source_url?: string | null
          license?: string | null
          license_url?: string | null
          attribution_required?: boolean
          attribution_text?: string | null
          imported_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          short_description?: string | null
          description?: string | null
          product_type?: 'single_template' | 'bundle'
          resource_type?: 'resume' | 'cover_letter' | 'referral_message' | 'cold_email'
          category?: string | null
          tags?: string[]
          suitable_for?: string[]
          features?: string[]
          ats_friendly?: boolean
          file_format?: string | null
          file_url?: string | null
          preview_image_url?: string | null
          original_price?: number
          current_price?: number
          status?: 'draft' | 'published' | 'archived'
          pinned?: boolean
          sort_order?: number
          seo_title?: string | null
          seo_description?: string | null
          og_image?: string | null
          source_url?: string | null
          license?: string | null
          license_url?: string | null
          attribution_required?: boolean
          attribution_text?: string | null
          imported_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bundle_resources: {
        Row: {
          id: string
          bundle_product_id: string
          resource_product_id: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          bundle_product_id: string
          resource_product_id: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          bundle_product_id?: string
          resource_product_id?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_resources_bundle_product_id_fkey"
            columns: ["bundle_product_id"]
            isOneToOne: false
            referencedRelation: "career_tool_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_resources_resource_product_id_fkey"
            columns: ["resource_product_id"]
            isOneToOne: false
            referencedRelation: "career_tool_products"
            referencedColumns: ["id"]
          }
        ]
      }
      ats_settings: {
        Row: {
          id: string
          provider: string
          model: string
          base_url: string | null
          api_key: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider?: string
          model?: string
          base_url?: string | null
          api_key?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider?: string
          model?: string
          base_url?: string | null
          api_key?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
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
      auto_enable_ads: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "editor"
      job_status: "draft" | "published" | "archived"
      career_product_type: "single_template" | "bundle"
      career_resource_type: "resume" | "cover_letter" | "referral_message" | "cold_email"
      career_product_status: "draft" | "published" | "archived"
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
      career_product_type: ["single_template", "bundle"],
      career_resource_type: ["resume", "cover_letter", "referral_message", "cold_email"],
      career_product_status: ["draft", "published", "archived"],
    },
  },
} as const
