export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      reviews: {
        Row: {
          id: string
          title: string
          description: string
          status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
          priority: 'LOW' | 'MEDIUM' | 'HIGH'
          createdAt: string
          updatedAt: string
          userId: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH'
          createdAt?: string
          updatedAt?: string
          userId: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
          priority?: 'LOW' | 'MEDIUM' | 'HIGH'
          createdAt?: string
          updatedAt?: string
          userId?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 