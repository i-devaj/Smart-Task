export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          code?: string | null
          created_at?: string
        }
        Relationships: []
      },
      evaluations: {
        Row: {
          id: string
          task_id: string
          user_id: string
          result: unknown
          created_at: string
          is_paid: boolean | null
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          result: unknown
          created_at?: string
          is_paid?: boolean | null
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          result?: unknown
          created_at?: string
          is_paid?: boolean | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}



