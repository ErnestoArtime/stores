export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          slug: string;
          name: string;
          legal_name: string;
          plan: string;
          currency: string;
          support_phone: string | null;
          support_whatsapp: string | null;
          primary_color: string;
          accent_color: string;
          logo_url: string | null;
          hero_image_url: string | null;
          features: Json;
          limits: Json;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          legal_name: string;
          plan?: string;
          currency?: string;
          support_phone?: string | null;
          support_whatsapp?: string | null;
          primary_color?: string;
          accent_color?: string;
          logo_url?: string | null;
          hero_image_url?: string | null;
          features?: Json;
          limits?: Json;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
        Relationships: [];
      };
      tenant_billing: {
        Row: {
          tenant_id: string;
          plan: string;
          status: string;
          current_period_end: string | null;
          updated_at: string;
        };
        Insert: {
          tenant_id: string;
          plan?: string;
          status?: string;
          current_period_end?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tenant_billing']['Insert']>;
        Relationships: [
          { foreignKeyName: 'tenant_billing_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] }
        ];
      };
      profiles: {
        Row: {
          id: string;
          tenant_id: string;
          full_name: string;
          email: string;
          role: Database['public']['Enums']['staff_role'];
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          full_name: string;
          email: string;
          role?: Database['public']['Enums']['staff_role'];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [
          { foreignKeyName: 'profiles_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] }
        ];
      };
      superadmins: {
        Row: { id: string; created_at: string };
        Insert: { id: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['superadmins']['Insert']>;
        Relationships: [];
      };
      store_locations: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          type: string;
          address: string;
          city: string;
          municipality: string;
          phone: string | null;
          open_now: boolean;
          delivery_minutes: number;
          rating: number;
          cover_url: string | null;
          fulfillment: Database['public']['Enums']['fulfillment_type'][];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          type?: string;
          address: string;
          city: string;
          municipality: string;
          phone?: string | null;
          open_now?: boolean;
          delivery_minutes?: number;
          rating?: number;
          cover_url?: string | null;
          fulfillment?: Database['public']['Enums']['fulfillment_type'][];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['store_locations']['Insert']>;
        Relationships: [
          { foreignKeyName: 'store_locations_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] }
        ];
      };
      categories: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          icon: string;
          featured: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          icon?: string;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
        Relationships: [
          { foreignKeyName: 'categories_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] }
        ];
      };
      products: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          category_id: string;
          sku: string;
          name: string;
          description: string;
          image_url: string | null;
          price: number;
          compare_at_price: number | null;
          stock: number;
          unit: string;
          status: Database['public']['Enums']['product_status'];
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          category_id: string;
          sku: string;
          name: string;
          description?: string;
          image_url?: string | null;
          price: number;
          compare_at_price?: number | null;
          stock?: number;
          unit?: string;
          status?: Database['public']['Enums']['product_status'];
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
        Relationships: [
          { foreignKeyName: 'products_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] },
          { foreignKeyName: 'products_store_id_fkey'; columns: ['store_id']; referencedRelation: 'store_locations'; referencedColumns: ['id'] },
          { foreignKeyName: 'products_category_id_fkey'; columns: ['category_id']; referencedRelation: 'categories'; referencedColumns: ['id'] }
        ];
      };
      delivery_zones: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          fee: number;
          eta_minutes: number;
          municipalities: string[];
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          fee?: number;
          eta_minutes?: number;
          municipalities?: string[];
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['delivery_zones']['Insert']>;
        Relationships: [
          { foreignKeyName: 'delivery_zones_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] }
        ];
      };
      orders: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          customer_id: string | null;
          code: string;
          customer_name: string;
          customer_phone: string;
          delivery_address: string;
          status: Database['public']['Enums']['order_status'];
          payment_method: Database['public']['Enums']['payment_method'];
          subtotal: number;
          delivery_fee: number;
          discount: number;
          total: number;
          delivery_zone: string | null;
          delivery_window: string | null;
          assigned_courier_id: string | null;
          placed_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id: string;
          customer_id?: string | null;
          code: string;
          customer_name: string;
          customer_phone: string;
          delivery_address: string;
          status?: Database['public']['Enums']['order_status'];
          payment_method?: Database['public']['Enums']['payment_method'];
          subtotal: number;
          delivery_fee?: number;
          discount?: number;
          delivery_zone?: string | null;
          delivery_window?: string | null;
          assigned_courier_id?: string | null;
          placed_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
        Relationships: [
          { foreignKeyName: 'orders_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] },
          { foreignKeyName: 'orders_store_id_fkey'; columns: ['store_id']; referencedRelation: 'store_locations'; referencedColumns: ['id'] }
        ];
      };
      order_items: {
        Row: {
          id: string;
          tenant_id: string;
          order_id: string;
          product_id: string | null;
          name: string;
          quantity: number;
          unit_price: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          order_id: string;
          product_id?: string | null;
          name: string;
          quantity: number;
          unit_price: number;
        };
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
        Relationships: [
          { foreignKeyName: 'order_items_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] },
          { foreignKeyName: 'order_items_order_id_fkey'; columns: ['order_id']; referencedRelation: 'orders'; referencedColumns: ['id'] },
          { foreignKeyName: 'order_items_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id'] }
        ];
      };
      order_status_events: {
        Row: {
          id: string;
          tenant_id: string;
          order_id: string;
          from_status: Database['public']['Enums']['order_status'] | null;
          to_status: Database['public']['Enums']['order_status'];
          actor_id: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          order_id: string;
          from_status?: Database['public']['Enums']['order_status'] | null;
          to_status: Database['public']['Enums']['order_status'];
          actor_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_status_events']['Insert']>;
        Relationships: [
          { foreignKeyName: 'order_status_events_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] },
          { foreignKeyName: 'order_status_events_order_id_fkey'; columns: ['order_id']; referencedRelation: 'orders'; referencedColumns: ['id'] }
        ];
      };
      promotions: {
        Row: {
          id: string;
          tenant_id: string;
          title: string;
          description: string;
          type: Database['public']['Enums']['promotion_type'];
          code: string | null;
          value: number;
          starts_at: string;
          ends_at: string;
          active: boolean;
          target_category_ids: string[];
          minimum_order_total: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          title: string;
          description?: string;
          type: Database['public']['Enums']['promotion_type'];
          code?: string | null;
          value?: number;
          starts_at: string;
          ends_at: string;
          active?: boolean;
          target_category_ids?: string[];
          minimum_order_total?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['promotions']['Insert']>;
        Relationships: [
          { foreignKeyName: 'promotions_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] }
        ];
      };
      couriers: {
        Row: {
          id: string;
          tenant_id: string;
          full_name: string;
          phone: string;
          active: boolean;
          current_zone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          full_name: string;
          phone: string;
          active?: boolean;
          current_zone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['couriers']['Insert']>;
        Relationships: [
          { foreignKeyName: 'couriers_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] }
        ];
      };
      delivery_routes: {
        Row: {
          id: string;
          tenant_id: string;
          courier_id: string;
          zone_name: string;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          courier_id: string;
          zone_name: string;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['delivery_routes']['Insert']>;
        Relationships: [
          { foreignKeyName: 'delivery_routes_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] },
          { foreignKeyName: 'delivery_routes_courier_id_fkey'; columns: ['courier_id']; referencedRelation: 'couriers'; referencedColumns: ['id'] }
        ];
      };
      delivery_route_stops: {
        Row: {
          id: string;
          tenant_id: string;
          route_id: string;
          order_id: string;
          stop_order: number;
          eta_minutes: number;
          proof_code: string | null;
          proof_photo_url: string | null;
          delivered_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          route_id: string;
          order_id: string;
          stop_order: number;
          eta_minutes?: number;
          proof_code?: string | null;
          proof_photo_url?: string | null;
          delivered_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['delivery_route_stops']['Insert']>;
        Relationships: [
          { foreignKeyName: 'delivery_route_stops_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] },
          { foreignKeyName: 'delivery_route_stops_route_id_fkey'; columns: ['route_id']; referencedRelation: 'delivery_routes'; referencedColumns: ['id'] },
          { foreignKeyName: 'delivery_route_stops_order_id_fkey'; columns: ['order_id']; referencedRelation: 'orders'; referencedColumns: ['id'] }
        ];
      };
      loyalty_tiers: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          minimum_spend: number;
          points_multiplier: number;
          perks: string[];
          active: boolean;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          minimum_spend?: number;
          points_multiplier?: number;
          perks?: string[];
          active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['loyalty_tiers']['Insert']>;
        Relationships: [
          { foreignKeyName: 'loyalty_tiers_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] }
        ];
      };
      customer_segments: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          criteria: string;
          customer_count: number;
          active: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          criteria: string;
          customer_count?: number;
          active?: boolean;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customer_segments']['Insert']>;
        Relationships: [
          { foreignKeyName: 'customer_segments_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] }
        ];
      };
      notification_templates: {
        Row: {
          id: string;
          tenant_id: string;
          channel: Database['public']['Enums']['notification_channel'];
          event_key: string;
          title: string;
          body: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          channel: Database['public']['Enums']['notification_channel'];
          event_key: string;
          title: string;
          body: string;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notification_templates']['Insert']>;
        Relationships: [
          { foreignKeyName: 'notification_templates_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] }
        ];
      };
      import_jobs: {
        Row: {
          id: string;
          tenant_id: string;
          created_by: string | null;
          type: string;
          status: Database['public']['Enums']['import_job_status'];
          source_file_url: string | null;
          valid_rows: number;
          issue_count: number;
          issues: Json;
          rows_imported: number;
          rows_updated: number;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          created_by?: string | null;
          type?: string;
          status?: Database['public']['Enums']['import_job_status'];
          source_file_url?: string | null;
          valid_rows?: number;
          issue_count?: number;
          issues?: Json;
          rows_imported?: number;
          rows_updated?: number;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['import_jobs']['Insert']>;
        Relationships: [
          { foreignKeyName: 'import_jobs_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] }
        ];
      };
      audit_events: {
        Row: {
          id: string;
          tenant_id: string | null;
          actor_id: string | null;
          entity_type: string;
          entity_id: string | null;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          actor_id?: string | null;
          entity_type: string;
          entity_id?: string | null;
          action: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_events']['Insert']>;
        Relationships: [
          { foreignKeyName: 'audit_events_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] }
        ];
      };
      carts: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          items: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id: string;
          items?: Json;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['carts']['Insert']>;
        Relationships: [
          { foreignKeyName: 'carts_tenant_id_fkey'; columns: ['tenant_id']; referencedRelation: 'tenants'; referencedColumns: ['id'] }
        ];
      };
    };
    Views: {};
    Functions: {
      current_profile_has_role: {
        Args: { target_tenant_id: string; allowed_roles: Database['public']['Enums']['staff_role'][] };
        Returns: boolean;
      };
      is_superadmin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      create_new_tenant: {
        Args: { p_name: string; p_legal_name: string; p_slug: string; p_plan: string; p_currency: string };
        Returns: string;
      };
      notify_order_status_change: {
        Args: { p_order_id: string; p_event_key: string; p_channel?: string };
        Returns: void;
      };
    };
    Enums: {
      staff_role: 'owner' | 'manager' | 'catalog' | 'dispatch' | 'viewer';
      product_status: 'draft' | 'active' | 'archived';
      order_status: 'draft' | 'placed' | 'confirmed' | 'picking' | 'on_route' | 'delivered' | 'cancelled';
      payment_method: 'cash' | 'transfer' | 'pos' | 'online';
      fulfillment_type: 'delivery' | 'pickup' | 'scheduled';
      promotion_type: 'percent' | 'fixed' | 'bundle' | 'free_delivery';
      notification_channel: 'whatsapp' | 'email' | 'push' | 'telegram';
      import_job_status: 'draft' | 'validating' | 'ready' | 'processing' | 'completed' | 'failed';
    };
    CompositeTypes: {};
  };
};
