
/**
 * This file contains TypeScript definitions for the Supabase database schema.
 * These types allow TypeScript to understand the shape of your database tables.
 */

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
      students: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          instructor_id?: string
          progress?: number
          notes?: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          instructor_id?: string
          progress?: number
          notes?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          instructor_id?: string
          progress?: number
          notes?: string
        }
      }
      instructors: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          specialization?: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          specialization?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          specialization?: string
        }
      }
      classes: {
        Row: {
          id: string
          created_at: string
          title: string
          instructor_id: string
          date: string
          student_ids?: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          instructor_id: string
          date: string
          student_ids?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          instructor_id?: string
          date?: string
          student_ids?: string[]
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
