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
        Update: Partial<Database['public']['Tables']['document_chunks']['Row']>;
        Insert: {
          content: string;
          embedding?: number[] | null;
          source?: string | null;
          metadata?: Record<string, unknown> | null;
          user_id?: string | null;
        };
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
        Update: Partial<Database['public']['Tables']['knowledge_orbs']['Row']>;
        Insert: {
          title: string;
          source?: string | null;
          color: string;
          user_id: string;
        };
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
        Insert: {
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          xp: number;
        };
        Update: Partial<Database['public']['Tables']['user_profiles']['Row']>;
      };
      interactions: {
        Row: {
          id: number;
          created_at: string;
          user_id: string;
          type: string | null;
          xp_awarded: number;
        };
        Update: Partial<Database['public']['Tables']['interactions']['Row']>;
        Insert: {
          user_id: string;
          type?: string | null;
          xp_awarded: number;
        };
      };
    };
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: number;
          content: string;
          source: string;
          similarity: number;
        }[];
      };
      increment_xp: {
        Args: {
          user_id_param: string;
          xp_amount: number;
        };
        Returns: void;
      };
    };
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
