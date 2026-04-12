import { createClient } from '@supabase/supabase-js';

export type Database = {
  public: {
    Tables: {
      document_chunks: {
        Row: {
          id: number;
          created_at: string;
          content: string;
          embedding: number[] | null;
          source: string | null;
          metadata: Record<string, unknown> | null;
          user_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['document_chunks']['Row'], 'id' | 'created_at'>;
      };
      knowledge_orbs: {
        Row: {
          id: number;
          created_at: string;
          title: string;
          source: string | null;
          color: string;
          user_id: string;
        };
        Insert: Omit<Database['public']['Tables']['knowledge_orbs']['Row'], 'id' | 'created_at'>;
      };
      user_profiles: {
        Row: {
          id: number;
          created_at: string;
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          xp: number;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
      interactions: {
        Row: {
          id: number;
          created_at: string;
          user_id: string;
          type: string | null;
          xp_awarded: number;
        };
        Insert: Omit<Database['public']['Tables']['interactions']['Row'], 'id' | 'created_at'>;
      };
    };
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
