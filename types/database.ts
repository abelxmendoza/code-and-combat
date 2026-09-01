// Hand-maintained mirror of the Supabase schema in supabase/migrations/.
// Regenerate against a live project with:
//   supabase gen types typescript --project-id <id> > types/database.ts
// Keep in sync with the migrations any time a column changes.
//
// IMPORTANT: every table needs Row/Insert/Update/Relationships (even
// RPC-only tables — use the Row shape rather than `never`) and the schema
// needs a `Views` key. @supabase/supabase-js's SupabaseClient generic does
// `Schema extends GenericSchema ? Schema : never` — if this shape doesn't
// structurally satisfy GenericSchema, EVERY query on the client silently
// resolves to `never`, not just the table you got wrong.

export type AppRole = 'admin' | 'client';
export type ServiceCategory = 'code' | 'combat';
export type DeliveryType = 'online' | 'in-person' | 'hybrid';
export type PriceUnit = 'session' | 'person';
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled_by_client'
  | 'cancelled_by_admin'
  | 'no_show';
export type RegistrationStatus = 'confirmed' | 'cancelled' | 'waitlisted';
export type GroupEventStatus = 'scheduled' | 'cancelled' | 'completed';
export type NotificationChannel = 'email' | 'sms';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13';
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          timezone?: string;
        };
        Update: Partial<{
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          timezone: string;
        }>;
        Relationships: [];
      };
      user_roles: {
        Row: { user_id: string; role: AppRole; created_at: string };
        Insert: { user_id: string; role: AppRole };
        Update: Partial<{ role: AppRole }>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          slug: string;
          name: string;
          short_description: string;
          full_description: string;
          category: ServiceCategory;
          duration_minutes: number;
          buffer_minutes: number;
          price_cents: number;
          price_unit: PriceUnit;
          delivery_type: DeliveryType;
          max_participants: number;
          image_url: string | null;
          preparation_instructions: string | null;
          requires_waiver: boolean;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<
          Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>
        > &
          Pick<
            Database['public']['Tables']['services']['Row'],
            'slug' | 'name' | 'short_description' | 'full_description' | 'category' | 'duration_minutes' | 'price_cents' | 'delivery_type'
          >;
        Update: Partial<Database['public']['Tables']['services']['Row']>;
        Relationships: [];
      };
      service_locations: {
        Row: {
          id: string;
          service_id: string;
          label: string;
          address: string | null;
          meeting_instructions: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['service_locations']['Row'], 'id' | 'created_at' | 'updated_at'>> &
          Pick<Database['public']['Tables']['service_locations']['Row'], 'service_id' | 'label'>;
        Update: Partial<Database['public']['Tables']['service_locations']['Row']>;
        Relationships: [];
      };
      availability_rules: {
        Row: {
          id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          category: ServiceCategory | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['availability_rules']['Row'], 'id' | 'created_at' | 'updated_at'>> &
          Pick<Database['public']['Tables']['availability_rules']['Row'], 'day_of_week' | 'start_time' | 'end_time'>;
        Update: Partial<Database['public']['Tables']['availability_rules']['Row']>;
        Relationships: [];
      };
      availability_overrides: {
        Row: {
          id: string;
          date: string;
          start_time: string;
          end_time: string;
          is_available: boolean;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['availability_overrides']['Row'], 'id' | 'created_at' | 'updated_at'>> &
          Pick<Database['public']['Tables']['availability_overrides']['Row'], 'date' | 'start_time' | 'end_time'>;
        Update: Partial<Database['public']['Tables']['availability_overrides']['Row']>;
        Relationships: [];
      };
      calendar_blocks: {
        Row: {
          id: string;
          start_time: string;
          end_time: string;
          reason: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['calendar_blocks']['Row'], 'id' | 'created_at' | 'updated_at'>> &
          Pick<Database['public']['Tables']['calendar_blocks']['Row'], 'start_time' | 'end_time'>;
        Update: Partial<Database['public']['Tables']['calendar_blocks']['Row']>;
        Relationships: [];
      };
      booking_settings: {
        Row: {
          id: boolean;
          business_timezone: string;
          min_notice_hours: number;
          booking_window_days: number;
          cancellation_notice_hours: number;
          reschedule_notice_hours: number;
          hold_duration_minutes: number;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['booking_settings']['Row']>;
        Update: Partial<Omit<Database['public']['Tables']['booking_settings']['Row'], 'id'>>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          booking_reference: string;
          service_id: string;
          status: AppointmentStatus;
          start_time: string;
          end_time: string;
          buffer_minutes: number;
          price_cents: number;
          price_unit: PriceUnit;
          duration_minutes: number;
          capacity: number;
          delivery_type: DeliveryType;
          location: string | null;
          client_timezone: string;
          notes: string | null;
          admin_notes: string | null;
          management_token: string;
          token_expires_at: string;
          created_at: string;
          updated_at: string;
        };
        // Real writes only happen via the book_appointment() RPC; this Insert
        // shape exists purely to satisfy GenericTable and is never used
        // directly (RLS blocks non-admin direct inserts anyway).
        Insert: Partial<Database['public']['Tables']['appointments']['Row']>;
        Update: Partial<Pick<Database['public']['Tables']['appointments']['Row'], 'status' | 'admin_notes' | 'notes' | 'start_time' | 'end_time'>>;
        Relationships: [
          {
            foreignKeyName: 'appointments_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
        ];
      };
      appointment_participants: {
        Row: {
          id: string;
          appointment_id: string;
          client_id: string | null;
          client_name: string;
          client_email: string;
          client_phone: string | null;
          is_primary_contact: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['appointment_participants']['Row']>;
        Update: Partial<Database['public']['Tables']['appointment_participants']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'appointment_participants_appointment_id_fkey';
            columns: ['appointment_id'];
            isOneToOne: false;
            referencedRelation: 'appointments';
            referencedColumns: ['id'];
          },
        ];
      };
      appointment_status_events: {
        Row: {
          id: string;
          appointment_id: string;
          from_status: AppointmentStatus | null;
          to_status: AppointmentStatus;
          changed_by: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['appointment_status_events']['Row']>;
        Update: Partial<Database['public']['Tables']['appointment_status_events']['Row']>;
        Relationships: [];
      };
      group_events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          category: ServiceCategory;
          start_time: string;
          duration_minutes: number;
          capacity: number;
          price_cents: number;
          price_unit: PriceUnit;
          delivery_type: DeliveryType;
          location: string | null;
          status: GroupEventStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['group_events']['Row'], 'id' | 'created_at' | 'updated_at'>> &
          Pick<Database['public']['Tables']['group_events']['Row'], 'slug' | 'title' | 'description' | 'start_time' | 'duration_minutes' | 'capacity' | 'price_cents' | 'delivery_type'>;
        Update: Partial<Database['public']['Tables']['group_events']['Row']>;
        Relationships: [];
      };
      event_registrations: {
        Row: {
          id: string;
          event_id: string;
          client_id: string | null;
          client_name: string;
          client_email: string;
          client_phone: string | null;
          status: RegistrationStatus;
          management_token: string;
          token_expires_at: string;
          created_at: string;
          updated_at: string;
        };
        // Real writes only happen via register_for_event() /
        // cancel_event_registration_by_token() RPCs.
        Insert: Partial<Database['public']['Tables']['event_registrations']['Row']>;
        Update: Partial<Database['public']['Tables']['event_registrations']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'event_registrations_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'group_events';
            referencedColumns: ['id'];
          },
        ];
      };
      client_notes: {
        Row: {
          id: string;
          client_email: string;
          client_id: string | null;
          note: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Pick<Database['public']['Tables']['client_notes']['Row'], 'client_email' | 'note'> &
          Partial<Pick<Database['public']['Tables']['client_notes']['Row'], 'client_id' | 'created_by'>>;
        Update: Partial<Pick<Database['public']['Tables']['client_notes']['Row'], 'note'>>;
        Relationships: [];
      };
      waiver_records: {
        Row: {
          id: string;
          client_email: string;
          client_id: string | null;
          service_id: string | null;
          appointment_id: string | null;
          waiver_version: string;
          full_name: string;
          signed_at: string;
          ip_address: string | null;
          created_at: string;
        };
        // Real writes happen inside book_appointment() only.
        Insert: Partial<Database['public']['Tables']['waiver_records']['Row']>;
        Update: Partial<Database['public']['Tables']['waiver_records']['Row']>;
        Relationships: [];
      };
      notification_log: {
        Row: {
          id: string;
          channel: NotificationChannel;
          template: string;
          recipient: string;
          appointment_id: string | null;
          event_registration_id: string | null;
          status: NotificationStatus;
          provider: string;
          error_message: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: Pick<Database['public']['Tables']['notification_log']['Row'], 'channel' | 'template' | 'recipient'> &
          Partial<Omit<Database['public']['Tables']['notification_log']['Row'], 'id' | 'created_at' | 'channel' | 'template' | 'recipient'>>;
        Update: Partial<Pick<Database['public']['Tables']['notification_log']['Row'], 'status' | 'error_message'>>;
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          inquiry_type: string;
          preferred_contact_method: string;
          message: string;
          status: string;
          created_at: string;
        };
        Insert: Pick<
          Database['public']['Tables']['contact_messages']['Row'],
          'name' | 'email' | 'inquiry_type' | 'preferred_contact_method' | 'message'
        >;
        Update: Partial<Pick<Database['public']['Tables']['contact_messages']['Row'], 'status'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      book_appointment: {
        Args: {
          p_service_id: string;
          p_start_time: string;
          p_delivery_type: DeliveryType;
          p_client_name: string;
          p_client_email: string;
          p_client_phone: string | null;
          p_notes: string | null;
          p_client_timezone: string;
          p_waiver_accepted?: boolean;
          p_client_id?: string | null;
        };
        Returns: {
          appointment_id: string;
          booking_reference: string;
          management_token: string;
          start_time: string;
          end_time: string;
          price_cents: number;
          price_unit: PriceUnit;
          location: string | null;
        }[];
      };
      cancel_appointment_by_token: {
        Args: { p_appointment_id: string; p_token: string; p_client_email: string };
        Returns: boolean;
      };
      reschedule_appointment_by_token: {
        Args: { p_appointment_id: string; p_token: string; p_new_start_time: string };
        Returns: { appointment_id: string; start_time: string; end_time: string }[];
      };
      admin_reschedule_appointment: {
        Args: { p_appointment_id: string; p_new_start_time: string };
        Returns: { appointment_id: string; start_time: string; end_time: string }[];
      };
      register_for_event: {
        Args: {
          p_event_id: string;
          p_client_name: string;
          p_client_email: string;
          p_client_phone: string | null;
          p_client_id?: string | null;
        };
        Returns: { registration_id: string; status: RegistrationStatus; management_token: string }[];
      };
      cancel_event_registration_by_token: {
        Args: { p_registration_id: string; p_token: string };
        Returns: boolean;
      };
      is_within_availability: {
        Args: { p_start: string; p_end: string; p_category: ServiceCategory };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
  };
};
