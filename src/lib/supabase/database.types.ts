export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          diff: Json | null;
          entity_id: string | null;
          entity_type: string;
          id: string;
          module: string;
          summary: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          diff?: Json | null;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          module: string;
          summary?: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          diff?: Json | null;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          module?: string;
          summary?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_overrides: {
        Row: {
          date: string;
          end_time: string | null;
          id: string;
          is_blackout: boolean;
          reason: string | null;
          start_time: string | null;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          date: string;
          end_time?: string | null;
          id?: string;
          is_blackout?: boolean;
          reason?: string | null;
          start_time?: string | null;
          user_id?: string | null;
        };
        Update: {
          date?: string;
          end_time?: string | null;
          id?: string;
          is_blackout?: boolean;
          reason?: string | null;
          start_time?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "availability_overrides_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_rules: {
        Row: {
          end_time: string;
          id: string;
          start_time: string;
          user_id: string;
          weekday: number;
        };
        ComputedFields: never;
        Insert: {
          end_time: string;
          id?: string;
          start_time: string;
          user_id: string;
          weekday: number;
        };
        Update: {
          end_time?: string;
          id?: string;
          start_time?: string;
          user_id?: string;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "availability_rules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_events: {
        Row: {
          actor_id: string | null;
          booking_id: string;
          created_at: string;
          from_status: Database["public"]["Enums"]["booking_status"] | null;
          id: string;
          note: string | null;
          to_status: Database["public"]["Enums"]["booking_status"];
        };
        ComputedFields: never;
        Insert: {
          actor_id?: string | null;
          booking_id: string;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["booking_status"] | null;
          id?: string;
          note?: string | null;
          to_status: Database["public"]["Enums"]["booking_status"];
        };
        Update: {
          actor_id?: string | null;
          booking_id?: string;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["booking_status"] | null;
          id?: string;
          note?: string | null;
          to_status?: Database["public"]["Enums"]["booking_status"];
        };
        Relationships: [
          {
            foreignKeyName: "booking_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_type_hosts: {
        Row: {
          booking_type_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          booking_type_id: string;
          user_id: string;
        };
        Update: {
          booking_type_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_type_hosts_booking_type_id_fkey";
            columns: ["booking_type_id"];
            isOneToOne: false;
            referencedRelation: "booking_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_type_hosts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_types: {
        Row: {
          buffer_min: number;
          color: string;
          created_at: string;
          daily_cap: number | null;
          description: string | null;
          duration_min: number;
          id: string;
          intake_form_id: string | null;
          is_active: boolean;
          locations: NonNullable<Json>;
          max_days_ahead: number;
          min_notice_hours: number;
          name: string;
          requires_approval: boolean;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          buffer_min?: number;
          color?: string;
          created_at?: string;
          daily_cap?: number | null;
          description?: string | null;
          duration_min?: number;
          id?: string;
          intake_form_id?: string | null;
          is_active?: boolean;
          locations?: NonNullable<Json>;
          max_days_ahead?: number;
          min_notice_hours?: number;
          name: string;
          requires_approval?: boolean;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          buffer_min?: number;
          color?: string;
          created_at?: string;
          daily_cap?: number | null;
          description?: string | null;
          duration_min?: number;
          id?: string;
          intake_form_id?: string | null;
          is_active?: boolean;
          locations?: NonNullable<Json>;
          max_days_ahead?: number;
          min_notice_hours?: number;
          name?: string;
          requires_approval?: boolean;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_types_intake_form_id_fkey";
            columns: ["intake_form_id"];
            isOneToOne: false;
            referencedRelation: "forms";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          booking_type_id: string;
          cancel_reason: string | null;
          contact_id: string | null;
          created_at: string;
          email: string;
          ends_at: string;
          host_id: string | null;
          id: string;
          intake: NonNullable<Json>;
          location_detail: string | null;
          location_kind: Database["public"]["Enums"]["location_kind"];
          manage_token_hash: string | null;
          name: string;
          phone: string | null;
          reminder_24h_sent_at: string | null;
          reminder_2h_sent_at: string | null;
          starts_at: string;
          status: Database["public"]["Enums"]["booking_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          booking_type_id: string;
          cancel_reason?: string | null;
          contact_id?: string | null;
          created_at?: string;
          email: string;
          ends_at: string;
          host_id?: string | null;
          id?: string;
          intake?: NonNullable<Json>;
          location_detail?: string | null;
          location_kind?: Database["public"]["Enums"]["location_kind"];
          manage_token_hash?: string | null;
          name: string;
          phone?: string | null;
          reminder_24h_sent_at?: string | null;
          reminder_2h_sent_at?: string | null;
          starts_at: string;
          status?: Database["public"]["Enums"]["booking_status"];
          updated_at?: string;
        };
        Update: {
          booking_type_id?: string;
          cancel_reason?: string | null;
          contact_id?: string | null;
          created_at?: string;
          email?: string;
          ends_at?: string;
          host_id?: string | null;
          id?: string;
          intake?: NonNullable<Json>;
          location_detail?: string | null;
          location_kind?: Database["public"]["Enums"]["location_kind"];
          manage_token_hash?: string | null;
          name?: string;
          phone?: string | null;
          reminder_24h_sent_at?: string | null;
          reminder_2h_sent_at?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_booking_type_id_fkey";
            columns: ["booking_type_id"];
            isOneToOne: false;
            referencedRelation: "booking_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      contact_notes: {
        Row: {
          author_id: string | null;
          body: string;
          contact_id: string;
          created_at: string;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          body: string;
          contact_id: string;
          created_at?: string;
          id?: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          contact_id?: string;
          created_at?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_notes_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          address: string | null;
          city: string | null;
          consent_marketing: boolean;
          created_at: string;
          email: string | null;
          first_name: string;
          id: string;
          joined_at: string | null;
          last_name: string;
          notes: string | null;
          phone: string | null;
          tags: string[];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          city?: string | null;
          consent_marketing?: boolean;
          created_at?: string;
          email?: string | null;
          first_name?: string;
          id?: string;
          joined_at?: string | null;
          last_name?: string;
          notes?: string | null;
          phone?: string | null;
          tags?: string[];
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          consent_marketing?: boolean;
          created_at?: string;
          email?: string | null;
          first_name?: string;
          id?: string;
          joined_at?: string | null;
          last_name?: string;
          notes?: string | null;
          phone?: string | null;
          tags?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      email_log: {
        Row: {
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          error: string | null;
          id: string;
          provider_id: string | null;
          status: string;
          template_key: string | null;
          to_email: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          error?: string | null;
          id?: string;
          provider_id?: string | null;
          status?: string;
          template_key?: string | null;
          to_email: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          error?: string | null;
          id?: string;
          provider_id?: string | null;
          status?: string;
          template_key?: string | null;
          to_email?: string;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          body: string;
          is_active: boolean;
          key: string;
          name: string;
          subject: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          is_active?: boolean;
          key: string;
          name: string;
          subject: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          is_active?: boolean;
          key?: string;
          name?: string;
          subject?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      enquiries: {
        Row: {
          assigned_to: string | null;
          booking_id: string | null;
          consent: boolean;
          contact_id: string | null;
          created_at: string;
          data: NonNullable<Json>;
          email: string | null;
          expires_at: string | null;
          form_id: string | null;
          id: string;
          ip_hash: string | null;
          is_sensitive: boolean;
          name: string | null;
          phone: string | null;
          source_page: string | null;
          status: Database["public"]["Enums"]["enquiry_status"];
          type: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          assigned_to?: string | null;
          booking_id?: string | null;
          consent?: boolean;
          contact_id?: string | null;
          created_at?: string;
          data?: NonNullable<Json>;
          email?: string | null;
          expires_at?: string | null;
          form_id?: string | null;
          id?: string;
          ip_hash?: string | null;
          is_sensitive?: boolean;
          name?: string | null;
          phone?: string | null;
          source_page?: string | null;
          status?: Database["public"]["Enums"]["enquiry_status"];
          type: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          booking_id?: string | null;
          consent?: boolean;
          contact_id?: string | null;
          created_at?: string;
          data?: NonNullable<Json>;
          email?: string | null;
          expires_at?: string | null;
          form_id?: string | null;
          id?: string;
          ip_hash?: string | null;
          is_sensitive?: boolean;
          name?: string | null;
          phone?: string | null;
          source_page?: string | null;
          status?: Database["public"]["Enums"]["enquiry_status"];
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enquiries_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enquiries_booking_fk";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enquiries_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enquiries_form_id_fkey";
            columns: ["form_id"];
            isOneToOne: false;
            referencedRelation: "forms";
            referencedColumns: ["id"];
          },
        ];
      };
      enquiry_notes: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          enquiry_id: string;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          enquiry_id: string;
          id?: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          enquiry_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enquiry_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enquiry_notes_enquiry_id_fkey";
            columns: ["enquiry_id"];
            isOneToOne: false;
            referencedRelation: "enquiries";
            referencedColumns: ["id"];
          },
        ];
      };
      event_registrations: {
        Row: {
          checked_in_at: string | null;
          contact_id: string | null;
          created_at: string;
          email: string;
          event_id: string;
          guests: number;
          id: string;
          name: string;
          status: Database["public"]["Enums"]["registration_status"];
        };
        ComputedFields: never;
        Insert: {
          checked_in_at?: string | null;
          contact_id?: string | null;
          created_at?: string;
          email: string;
          event_id: string;
          guests?: number;
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["registration_status"];
        };
        Update: {
          checked_in_at?: string | null;
          contact_id?: string | null;
          created_at?: string;
          email?: string;
          event_id?: string;
          guests?: number;
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["registration_status"];
        };
        Relationships: [
          {
            foreignKeyName: "event_registrations_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          all_day: boolean;
          capacity: number | null;
          cover_media_id: string | null;
          created_at: string;
          description: NonNullable<Json>;
          ends_at: string | null;
          id: string;
          is_public: boolean;
          kind: Database["public"]["Enums"]["event_kind"];
          location: string | null;
          recurrence_rule: string | null;
          registration_enabled: boolean;
          slug: string;
          starts_at: string;
          status: Database["public"]["Enums"]["event_status"];
          title: string;
          updated_at: string;
          waitlist_enabled: boolean;
        };
        ComputedFields: never;
        Insert: {
          all_day?: boolean;
          capacity?: number | null;
          cover_media_id?: string | null;
          created_at?: string;
          description?: NonNullable<Json>;
          ends_at?: string | null;
          id?: string;
          is_public?: boolean;
          kind?: Database["public"]["Enums"]["event_kind"];
          location?: string | null;
          recurrence_rule?: string | null;
          registration_enabled?: boolean;
          slug: string;
          starts_at: string;
          status?: Database["public"]["Enums"]["event_status"];
          title: string;
          updated_at?: string;
          waitlist_enabled?: boolean;
        };
        Update: {
          all_day?: boolean;
          capacity?: number | null;
          cover_media_id?: string | null;
          created_at?: string;
          description?: NonNullable<Json>;
          ends_at?: string | null;
          id?: string;
          is_public?: boolean;
          kind?: Database["public"]["Enums"]["event_kind"];
          location?: string | null;
          recurrence_rule?: string | null;
          registration_enabled?: boolean;
          slug?: string;
          starts_at?: string;
          status?: Database["public"]["Enums"]["event_status"];
          title?: string;
          updated_at?: string;
          waitlist_enabled?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "events_cover_media_id_fkey";
            columns: ["cover_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      forms: {
        Row: {
          created_at: string;
          enquiry_type: string;
          fields: NonNullable<Json>;
          id: string;
          is_active: boolean;
          name: string;
          settings: NonNullable<Json>;
          slug: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          enquiry_type: string;
          fields?: NonNullable<Json>;
          id?: string;
          is_active?: boolean;
          name: string;
          settings?: NonNullable<Json>;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          enquiry_type?: string;
          fields?: NonNullable<Json>;
          id?: string;
          is_active?: boolean;
          name?: string;
          settings?: NonNullable<Json>;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      global_versions: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          key: string;
          snapshot: NonNullable<Json>;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          key: string;
          snapshot: NonNullable<Json>;
          version: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          key?: string;
          snapshot?: NonNullable<Json>;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "global_versions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "global_versions_key_fkey";
            columns: ["key"];
            isOneToOne: false;
            referencedRelation: "globals";
            referencedColumns: ["key"];
          },
        ];
      };
      globals: {
        Row: {
          draft: NonNullable<Json>;
          has_unpublished_changes: boolean;
          key: string;
          published: NonNullable<Json>;
          published_at: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          draft?: NonNullable<Json>;
          has_unpublished_changes?: boolean;
          key: string;
          published?: NonNullable<Json>;
          published_at?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          draft?: NonNullable<Json>;
          has_unpublished_changes?: boolean;
          key?: string;
          published?: NonNullable<Json>;
          published_at?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "globals_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: {
          alt: string;
          caption: string | null;
          created_at: string;
          file_name: string;
          folder_id: string | null;
          height: number | null;
          id: string;
          lqip: string | null;
          mime: string;
          size_bytes: number;
          storage_path: string;
          title: string | null;
          updated_at: string;
          uploaded_by: string | null;
          variants: NonNullable<Json>;
          width: number | null;
        };
        ComputedFields: never;
        Insert: {
          alt: string;
          caption?: string | null;
          created_at?: string;
          file_name: string;
          folder_id?: string | null;
          height?: number | null;
          id?: string;
          lqip?: string | null;
          mime: string;
          size_bytes?: number;
          storage_path: string;
          title?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
          variants?: NonNullable<Json>;
          width?: number | null;
        };
        Update: {
          alt?: string;
          caption?: string | null;
          created_at?: string;
          file_name?: string;
          folder_id?: string | null;
          height?: number | null;
          id?: string;
          lqip?: string | null;
          mime?: string;
          size_bytes?: number;
          storage_path?: string;
          title?: string | null;
          updated_at?: string;
          uploaded_by?: string | null;
          variants?: NonNullable<Json>;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "media_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "media_folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      media_folders: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          parent_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          parent_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          parent_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "media_folders_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "media_folders";
            referencedColumns: ["id"];
          },
        ];
      };
      media_usage: {
        Row: {
          entity_id: string;
          entity_type: string;
          field_path: string;
          media_id: string;
        };
        ComputedFields: never;
        Insert: {
          entity_id: string;
          entity_type: string;
          field_path: string;
          media_id: string;
        };
        Update: {
          entity_id?: string;
          entity_type?: string;
          field_path?: string;
          media_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_usage_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      page_sections: {
        Row: {
          created_at: string;
          data: NonNullable<Json>;
          id: string;
          page_id: string;
          sort_order: number;
          type: string;
          updated_at: string;
          visible: boolean;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          data?: NonNullable<Json>;
          id?: string;
          page_id: string;
          sort_order?: number;
          type: string;
          updated_at?: string;
          visible?: boolean;
        };
        Update: {
          created_at?: string;
          data?: NonNullable<Json>;
          id?: string;
          page_id?: string;
          sort_order?: number;
          type?: string;
          updated_at?: string;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "page_sections_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      page_versions: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_published: boolean;
          note: string | null;
          page_id: string;
          snapshot: NonNullable<Json>;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_published?: boolean;
          note?: string | null;
          page_id: string;
          snapshot: NonNullable<Json>;
          version: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_published?: boolean;
          note?: string | null;
          page_id?: string;
          snapshot?: NonNullable<Json>;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "page_versions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "page_versions_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          created_at: string;
          has_unpublished_changes: boolean;
          id: string;
          published_at: string | null;
          seo: NonNullable<Json>;
          slug: string;
          sort_order: number;
          status: Database["public"]["Enums"]["publish_status"];
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          has_unpublished_changes?: boolean;
          id?: string;
          published_at?: string | null;
          seo?: NonNullable<Json>;
          slug: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["publish_status"];
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          has_unpublished_changes?: boolean;
          id?: string;
          published_at?: string | null;
          seo?: NonNullable<Json>;
          slug?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["publish_status"];
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pages_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      post_categories: {
        Row: {
          category_id: string;
          post_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          post_id: string;
        };
        Update: {
          category_id?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_categories_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_tags: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        ComputedFields: never;
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          author_id: string | null;
          author_name: string;
          content: NonNullable<Json>;
          created_at: string;
          excerpt: string | null;
          featured_media_id: string | null;
          id: string;
          legacy_url: string | null;
          published_at: string | null;
          seo: NonNullable<Json>;
          slug: string;
          status: Database["public"]["Enums"]["post_status"];
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          author_name?: string;
          content?: NonNullable<Json>;
          created_at?: string;
          excerpt?: string | null;
          featured_media_id?: string | null;
          id?: string;
          legacy_url?: string | null;
          published_at?: string | null;
          seo?: NonNullable<Json>;
          slug: string;
          status?: Database["public"]["Enums"]["post_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          author_name?: string;
          content?: NonNullable<Json>;
          created_at?: string;
          excerpt?: string | null;
          featured_media_id?: string | null;
          id?: string;
          legacy_url?: string | null;
          published_at?: string | null;
          seo?: NonNullable<Json>;
          slug?: string;
          status?: Database["public"]["Enums"]["post_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_featured_media_id_fkey";
            columns: ["featured_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_media_id: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          is_active: boolean;
          last_seen_at: string | null;
          notification_prefs: NonNullable<Json>;
          require_mfa: boolean;
          role: Database["public"]["Enums"]["app_role"];
          signature: string | null;
          timezone: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_media_id?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id: string;
          is_active?: boolean;
          last_seen_at?: string | null;
          notification_prefs?: NonNullable<Json>;
          require_mfa?: boolean;
          role?: Database["public"]["Enums"]["app_role"];
          signature?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          avatar_media_id?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          last_seen_at?: string | null;
          notification_prefs?: NonNullable<Json>;
          require_mfa?: boolean;
          role?: Database["public"]["Enums"]["app_role"];
          signature?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_avatar_fk";
            columns: ["avatar_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      redirects: {
        Row: {
          created_at: string;
          from_path: string;
          hits: number;
          id: string;
          last_hit_at: string | null;
          status_code: number;
          to_path: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          from_path: string;
          hits?: number;
          id?: string;
          last_hit_at?: string | null;
          status_code?: number;
          to_path: string;
        };
        Update: {
          created_at?: string;
          from_path?: string;
          hits?: number;
          id?: string;
          last_hit_at?: string | null;
          status_code?: number;
          to_path?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          can_delete: boolean;
          can_edit: boolean;
          can_publish: boolean;
          can_sensitive: boolean;
          can_view: boolean;
          module: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        ComputedFields: never;
        Insert: {
          can_delete?: boolean;
          can_edit?: boolean;
          can_publish?: boolean;
          can_sensitive?: boolean;
          can_view?: boolean;
          module: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          can_delete?: boolean;
          can_edit?: boolean;
          can_publish?: boolean;
          can_sensitive?: boolean;
          can_view?: boolean;
          module?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      sermons: {
        Row: {
          audio_url: string | null;
          created_at: string;
          id: string;
          notes: NonNullable<Json>;
          preached_on: string | null;
          published_at: string | null;
          scripture: string | null;
          seo: NonNullable<Json>;
          series: string | null;
          slug: string;
          speaker: string | null;
          status: Database["public"]["Enums"]["post_status"];
          thumbnail_media_id: string | null;
          title: string;
          updated_at: string;
          youtube_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          audio_url?: string | null;
          created_at?: string;
          id?: string;
          notes?: NonNullable<Json>;
          preached_on?: string | null;
          published_at?: string | null;
          scripture?: string | null;
          seo?: NonNullable<Json>;
          series?: string | null;
          slug: string;
          speaker?: string | null;
          status?: Database["public"]["Enums"]["post_status"];
          thumbnail_media_id?: string | null;
          title: string;
          updated_at?: string;
          youtube_id?: string | null;
        };
        Update: {
          audio_url?: string | null;
          created_at?: string;
          id?: string;
          notes?: NonNullable<Json>;
          preached_on?: string | null;
          published_at?: string | null;
          scripture?: string | null;
          seo?: NonNullable<Json>;
          series?: string | null;
          slug?: string;
          speaker?: string | null;
          status?: Database["public"]["Enums"]["post_status"];
          thumbnail_media_id?: string | null;
          title?: string;
          updated_at?: string;
          youtube_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sermons_thumbnail_media_id_fkey";
            columns: ["thumbnail_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ];
      };
      subscribers: {
        Row: {
          confirmed_at: string | null;
          created_at: string;
          email: string;
          id: string;
          name: string | null;
          source: string | null;
          unsubscribed_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          confirmed_at?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          name?: string | null;
          source?: string | null;
          unsubscribed_at?: string | null;
        };
        Update: {
          confirmed_at?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string | null;
          source?: string | null;
          unsubscribed_at?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_permission: { Args: { p_action: string; p_module: string }; Returns: boolean };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      publish_global: { Args: { p_key: string }; Returns: number };
      publish_page: { Args: { p_note?: string; p_page_id: string }; Returns: number };
      restore_page_version: { Args: { p_version_id: string }; Returns: undefined };
    };
    Enums: {
      app_role: "super_admin" | "admin" | "pastor" | "editor" | "viewer";
      booking_status:
        | "requested"
        | "confirmed"
        | "rescheduled"
        | "cancelled"
        | "declined"
        | "completed"
        | "no_show";
      enquiry_status: "unread" | "read" | "follow_up" | "closed";
      event_kind: "service" | "conference" | "group" | "other";
      event_status: "scheduled" | "completed" | "cancelled" | "rescheduled";
      location_kind: "in_person" | "online" | "phone";
      post_status: "draft" | "scheduled" | "published";
      publish_status: "draft" | "published";
      registration_status: "registered" | "waitlisted" | "cancelled" | "attended";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "pastor", "editor", "viewer"],
      booking_status: [
        "requested",
        "confirmed",
        "rescheduled",
        "cancelled",
        "declined",
        "completed",
        "no_show",
      ],
      enquiry_status: ["unread", "read", "follow_up", "closed"],
      event_kind: ["service", "conference", "group", "other"],
      event_status: ["scheduled", "completed", "cancelled", "rescheduled"],
      location_kind: ["in_person", "online", "phone"],
      post_status: ["draft", "scheduled", "published"],
      publish_status: ["draft", "published"],
      registration_status: ["registered", "waitlisted", "cancelled", "attended"],
    },
  },
} as const;
