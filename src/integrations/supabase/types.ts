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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
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
      analytics_events: {
        Row: {
          blog_id: string | null
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          job_id: string | null
          path: string
          referrer: string | null
          search_query: string | null
          session_id: string
          visitor_id: string
        }
        Insert: {
          blog_id?: string | null
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          job_id?: string | null
          path: string
          referrer?: string | null
          search_query?: string | null
          session_id: string
          visitor_id: string
        }
        Update: {
          blog_id?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          job_id?: string | null
          path?: string
          referrer?: string | null
          search_query?: string | null
          session_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ats_settings: {
        Row: {
          api_key: string | null
          base_url: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          model: string
          provider: string
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          base_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model?: string
          provider?: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          base_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model?: string
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blogs: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          id: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bundle_resources: {
        Row: {
          bundle_product_id: string
          created_at: string | null
          id: string
          resource_product_id: string
          sort_order: number | null
        }
        Insert: {
          bundle_product_id: string
          created_at?: string | null
          id?: string
          resource_product_id: string
          sort_order?: number | null
        }
        Update: {
          bundle_product_id?: string
          created_at?: string | null
          id?: string
          resource_product_id?: string
          sort_order?: number | null
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
          },
        ]
      }
      career_tool_products: {
        Row: {
          ats_friendly: boolean | null
          attribution_required: boolean | null
          attribution_text: string | null
          category: string | null
          created_at: string | null
          current_price: number
          description: string | null
          download_file_name: string | null
          features: string[] | null
          file_format: string | null
          file_url: string | null
          id: string
          imported_at: string | null
          license: string | null
          license_url: string | null
          og_image: string | null
          original_price: number
          pinned: boolean | null
          preview_image_url: string | null
          product_type: Database["public"]["Enums"]["career_product_type"]
          resource_type: Database["public"]["Enums"]["career_resource_type"]
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          sort_order: number | null
          source_url: string | null
          status: Database["public"]["Enums"]["career_product_status"]
          suitable_for: string[] | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ats_friendly?: boolean | null
          attribution_required?: boolean | null
          attribution_text?: string | null
          category?: string | null
          created_at?: string | null
          current_price?: number
          description?: string | null
          download_file_name?: string | null
          features?: string[] | null
          file_format?: string | null
          file_url?: string | null
          id?: string
          imported_at?: string | null
          license?: string | null
          license_url?: string | null
          og_image?: string | null
          original_price?: number
          pinned?: boolean | null
          preview_image_url?: string | null
          product_type?: Database["public"]["Enums"]["career_product_type"]
          resource_type?: Database["public"]["Enums"]["career_resource_type"]
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["career_product_status"]
          suitable_for?: string[] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ats_friendly?: boolean | null
          attribution_required?: boolean | null
          attribution_text?: string | null
          category?: string | null
          created_at?: string | null
          current_price?: number
          description?: string | null
          download_file_name?: string | null
          features?: string[] | null
          file_format?: string | null
          file_url?: string | null
          id?: string
          imported_at?: string | null
          license?: string | null
          license_url?: string | null
          og_image?: string | null
          original_price?: number
          pinned?: boolean | null
          preview_image_url?: string | null
          product_type?: Database["public"]["Enums"]["career_product_type"]
          resource_type?: Database["public"]["Enums"]["career_resource_type"]
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["career_product_status"]
          suitable_for?: string[] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      career_tool_orders: {
        Row: {
          id: string
          product_id: string | null
          buyer_email: string
          buyer_name: string | null
          buyer_phone: string | null
          amount: number
          currency: string
          status: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          created_at: string
          paid_at: string | null
          failed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          product_id?: string | null
          buyer_email: string
          buyer_name?: string | null
          buyer_phone?: string | null
          amount: number
          currency?: string
          status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          created_at?: string
          paid_at?: string | null
          failed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string | null
          buyer_email?: string
          buyer_name?: string | null
          buyer_phone?: string | null
          amount?: number
          currency?: string
          status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          created_at?: string
          paid_at?: string | null
          failed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_tool_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "career_tool_products"
            referencedColumns: ["id"]
          }
        ]
      }
      career_tool_download_events: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          downloaded_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          downloaded_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          downloaded_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_tool_download_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "career_tool_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_tool_download_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "career_tool_products"
            referencedColumns: ["id"]
          }
        ]
      }
      company_sources: {
        Row: {
          career_url: string
          company_name: string
          crawl_frequency: string | null
          created_at: string
          enabled: boolean | null
          id: string
          last_checked: string | null
          last_success: string | null
          platform: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          career_url: string
          company_name: string
          crawl_frequency?: string | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          last_checked?: string | null
          last_success?: string | null
          platform?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          career_url?: string
          company_name?: string
          crawl_frequency?: string | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          last_checked?: string | null
          last_success?: string | null
          platform?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crawl_logs: {
        Row: {
          company_source_id: string
          duplicates_skipped: number | null
          duration_ms: number | null
          error_message: string | null
          failed_jobs: number | null
          finished_at: string | null
          id: string
          jobs_added: number | null
          jobs_found: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          company_source_id: string
          duplicates_skipped?: number | null
          duration_ms?: number | null
          error_message?: string | null
          failed_jobs?: number | null
          finished_at?: string | null
          id?: string
          jobs_added?: number | null
          jobs_found?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          company_source_id?: string
          duplicates_skipped?: number | null
          duration_ms?: number | null
          error_message?: string | null
          failed_jobs?: number | null
          finished_at?: string | null
          id?: string
          jobs_added?: number | null
          jobs_found?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crawl_logs_company_source_id_fkey"
            columns: ["company_source_id"]
            isOneToOne: false
            referencedRelation: "company_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
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
          company_logo_storage_url: string | null
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
          subcategory: string | null
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
          company_logo_storage_url?: string | null
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
          subcategory?: string | null
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
          company_logo_storage_url?: string | null
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
          subcategory?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          ads_auto_enable_at: string | null
          ads_disabled_at: string | null
          ads_enabled: boolean
          canonical_url: string | null
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          copyright_text: string | null
          favicon_url: string | null
          footer_description: string | null
          github_url: string | null
          google_maps_url: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          logo_url: string | null
          og_image_url: string | null
          privacy_policy_url: string | null
          quick_links: Json | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          site_name: string
          site_tagline: string | null
          telegram_url: string | null
          terms_conditions_url: string | null
          updated_at: string
          whatsapp_url: string | null
          x_twitter_url: string | null
        }
        Insert: {
          ads_auto_enable_at?: string | null
          ads_disabled_at?: string | null
          ads_enabled?: boolean
          canonical_url?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          copyright_text?: string | null
          favicon_url?: string | null
          footer_description?: string | null
          github_url?: string | null
          google_maps_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          og_image_url?: string | null
          privacy_policy_url?: string | null
          quick_links?: Json | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          site_name?: string
          site_tagline?: string | null
          telegram_url?: string | null
          terms_conditions_url?: string | null
          updated_at?: string
          whatsapp_url?: string | null
          x_twitter_url?: string | null
        }
        Update: {
          ads_auto_enable_at?: string | null
          ads_disabled_at?: string | null
          ads_enabled?: boolean
          canonical_url?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          copyright_text?: string | null
          favicon_url?: string | null
          footer_description?: string | null
          github_url?: string | null
          google_maps_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          og_image_url?: string | null
          privacy_policy_url?: string | null
          quick_links?: Json | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          site_name?: string
          site_tagline?: string | null
          telegram_url?: string | null
          terms_conditions_url?: string | null
          updated_at?: string
          whatsapp_url?: string | null
          x_twitter_url?: string | null
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
      auto_enable_ads: { Args: never; Returns: undefined }
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
      career_product_status: "draft" | "published" | "archived"
      career_product_type: "single_template" | "bundle"
      career_resource_type:
        | "resume"
        | "cover_letter"
        | "referral_message"
        | "cold_email"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "editor"],
      career_product_status: ["draft", "published", "archived"],
      career_product_type: ["single_template", "bundle"],
      career_resource_type: [
        "resume",
        "cover_letter",
        "referral_message",
        "cold_email",
      ],
      job_status: ["draft", "published", "archived"],
    },
  },
} as const
