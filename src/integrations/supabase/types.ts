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
      availability_settings: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          blocked_date: string
          created_at?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          blocked_date?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          last_request_date: string
          name: string
          phone_number: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          last_request_date?: string
          name: string
          phone_number: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          last_request_date?: string
          name?: string
          phone_number?: string
          user_id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string | null
          id: string
          last_viewed_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_viewed_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_viewed_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          cash_enabled: boolean | null
          created_at: string
          id: string
          mpesa_enabled: boolean | null
          mpesa_id_type: string | null
          mpesa_phone: string | null
          user_id: string
          wallet_enabled: boolean | null
        }
        Insert: {
          cash_enabled?: boolean | null
          created_at?: string
          id?: string
          mpesa_enabled?: boolean | null
          mpesa_id_type?: string | null
          mpesa_phone?: string | null
          user_id: string
          wallet_enabled?: boolean | null
        }
        Update: {
          cash_enabled?: boolean | null
          created_at?: string
          id?: string
          mpesa_enabled?: boolean | null
          mpesa_id_type?: string | null
          mpesa_phone?: string | null
          user_id?: string
          wallet_enabled?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          banner_image_url: string | null
          company_name: string | null
          created_at: string | null
          currency: string | null
          id: string
          profile_image_url: string | null
          referral_source: string | null
          service_page_link: string | null
          service_requests_per_month: string | null
          service_type: string | null
          whatsapp_number: string | null
        }
        Insert: {
          banner_image_url?: string | null
          company_name?: string | null
          created_at?: string | null
          currency?: string | null
          id: string
          profile_image_url?: string | null
          referral_source?: string | null
          service_page_link?: string | null
          service_requests_per_month?: string | null
          service_type?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          banner_image_url?: string | null
          company_name?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          profile_image_url?: string | null
          referral_source?: string | null
          service_page_link?: string | null
          service_requests_per_month?: string | null
          service_type?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean | null
          name: string
          sequence: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean | null
          name: string
          sequence?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean | null
          name?: string
          sequence?: number | null
          user_id?: string
        }
        Relationships: []
      }
      service_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          sequence: number | null
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          sequence?: number | null
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          sequence?: number | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_images_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          paid: boolean | null
          scheduled_at: string | null
          service_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          paid?: boolean | null
          scheduled_at?: string | null
          service_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          paid?: boolean | null
          scheduled_at?: string | null
          service_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          instant_booking: boolean | null
          is_active: boolean | null
          name: string
          price: number
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          instant_booking?: boolean | null
          is_active?: boolean | null
          name: string
          price: number
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          instant_booking?: boolean | null
          is_active?: boolean | null
          name?: string
          price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      social_links: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          location: string | null
          platform_id: string
          title: string | null
          url: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          location?: string | null
          platform_id: string
          title?: string | null
          url?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          location?: string | null
          platform_id?: string
          title?: string | null
          url?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_page_views: {
        Args: {
          user_id_param: string
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
