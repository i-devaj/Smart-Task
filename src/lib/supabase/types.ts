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
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          code: string
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          code: string
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          code?: string
          status?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      evaluations: {
        Row: {
          id: string
          task_id: string
          score: number | null
          strengths: Json | null
          improvements: Json | null
          full_reports: string | null
          is_paid: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          score?: number | null
          strengths?: Json | null
          improvements?: Json | null
          full_reports?: string | null
          is_paid?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          score?: number | null
          strengths?: Json | null
          improvements?: Json | null
          full_reports?: string | null
          is_paid?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      },
      payments: {
        Row: {
          id: string
          user_id: string
          evaluation_id: string
          amount: number | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          evaluation_id: string
          amount?: number | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          evaluation_id?: string
          amount?: number | null
          status?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_evaluation_id_fkey"
            columns: ["evaluation_id"]
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}