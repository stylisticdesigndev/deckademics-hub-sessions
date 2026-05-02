export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          created_at: string | null
          dismissed: boolean
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string | null
          dismissed?: boolean
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string | null
          dismissed?: boolean
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          published_at: string | null
          target_role: Database["public"]["Enums"]["user_role"][] | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          published_at?: string | null
          target_role?: Database["public"]["Enums"]["user_role"][] | null
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          published_at?: string | null
          target_role?: Database["public"]["Enums"]["user_role"][] | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string | null
          hide_mock_users: boolean
          id: string
          notification_channels: Database["public"]["Enums"]["notification_channel"]
          notifications_enabled: boolean
          school_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          hide_mock_users?: boolean
          id?: string
          notification_channels?: Database["public"]["Enums"]["notification_channel"]
          notifications_enabled?: boolean
          school_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          hide_mock_users?: boolean
          id?: string
          notification_channels?: Database["public"]["Enums"]["notification_channel"]
          notifications_enabled?: boolean
          school_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string | null
          date: string
          id: string
          notes: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          class_id?: string | null
          date: string
          id?: string
          notes?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          class_id?: string | null
          date?: string
          id?: string
          notes?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          device_type: string | null
          id: string
          reporter_id: string
          reporter_role: string
          screenshot_url: string | null
          seen_by_admin: boolean
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          device_type?: string | null
          id?: string
          reporter_id: string
          reporter_role: string
          screenshot_url?: string | null
          seen_by_admin?: boolean
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          device_type?: string | null
          id?: string
          reporter_id?: string
          reporter_role?: string
          screenshot_url?: string | null
          seen_by_admin?: boolean
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          instructor_id: string | null
          location: string | null
          max_students: number | null
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          instructor_id?: string | null
          location?: string | null
          max_students?: number | null
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          instructor_id?: string | null
          location?: string | null
          max_students?: number | null
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          duration_weeks: number | null
          id: string
          level: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          level?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          level?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cover_sessions: {
        Row: {
          class_date: string
          class_time: string
          cover_instructor_id: string
          created_at: string
          created_by: string
          id: string
          student_id: string
        }
        Insert: {
          class_date: string
          class_time: string
          cover_instructor_id: string
          created_at?: string
          created_by: string
          id?: string
          student_id: string
        }
        Update: {
          class_date?: string
          class_time?: string
          cover_instructor_id?: string
          created_at?: string
          created_by?: string
          id?: string
          student_id?: string
        }
        Relationships: []
      }
      curriculum_lessons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          module_id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          module_id: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          module_id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level?: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          class_id: string
          enrollment_date: string | null
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          class_id: string
          enrollment_date?: string | null
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          class_id?: string
          enrollment_date?: string | null
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          device_type: string | null
          id: string
          requester_id: string
          requester_role: string
          screenshot_url: string | null
          seen_by_admin: boolean
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          device_type?: string | null
          id?: string
          requester_id: string
          requester_role: string
          screenshot_url?: string | null
          seen_by_admin?: boolean
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          device_type?: string | null
          id?: string
          requester_id?: string
          requester_role?: string
          screenshot_url?: string | null
          seen_by_admin?: boolean
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructor_ledger_entries: {
        Row: {
          amount: number
          class_date: string
          class_time: string | null
          created_at: string
          hourly_rate: number
          hours: number
          id: string
          instructor_id: string
          payment_id: string | null
          source: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          class_date: string
          class_time?: string | null
          created_at?: string
          hourly_rate?: number
          hours?: number
          id?: string
          instructor_id: string
          payment_id?: string | null
          source?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          class_date?: string
          class_time?: string | null
          created_at?: string
          hourly_rate?: number
          hours?: number
          id?: string
          instructor_id?: string
          payment_id?: string | null
          source?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructor_payment_extras: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          event_date: string
          id: string
          instructor_id: string
          payment_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          instructor_id: string
          payment_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          instructor_id?: string
          payment_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_payment_extras_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "instructor_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_payments: {
        Row: {
          amount: number
          bonus_amount: number
          bonus_description: string | null
          created_at: string | null
          description: string | null
          hours_worked: number | null
          id: string
          instructor_id: string
          pay_period_end: string
          pay_period_start: string
          payment_date: string | null
          payment_type: string
          status: string | null
        }
        Insert: {
          amount: number
          bonus_amount?: number
          bonus_description?: string | null
          created_at?: string | null
          description?: string | null
          hours_worked?: number | null
          id?: string
          instructor_id: string
          pay_period_end?: string
          pay_period_start?: string
          payment_date?: string | null
          payment_type?: string
          status?: string | null
        }
        Update: {
          amount?: number
          bonus_amount?: number
          bonus_description?: string | null
          created_at?: string | null
          description?: string | null
          hours_worked?: number | null
          id?: string
          instructor_id?: string
          pay_period_end?: string
          pay_period_start?: string
          payment_date?: string | null
          payment_type?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_payments_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_schedules: {
        Row: {
          created_at: string | null
          day: string
          hours: string
          id: string
          instructor_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day: string
          hours: string
          id?: string
          instructor_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day?: string
          hours?: string
          id?: string
          instructor_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_schedules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          bio: string | null
          hide_email: boolean
          hide_phone: boolean
          hourly_rate: number | null
          id: string
          session_fee: number
          specialties: string[] | null
          status: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          hide_email?: boolean
          hide_phone?: boolean
          hourly_rate?: number | null
          id: string
          session_fee?: number
          specialties?: string[] | null
          status?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          hide_email?: boolean
          hide_phone?: boolean
          hourly_rate?: number | null
          id?: string
          session_fee?: number
          specialties?: string[] | null
          status?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instructors_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          id: string
          image_url: string | null
          is_archived: boolean | null
          read_at: string | null
          receiver_id: string
          sender_id: string
          sent_at: string | null
          subject: string | null
        }
        Insert: {
          content: string
          id?: string
          image_url?: string | null
          is_archived?: boolean | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
          sent_at?: string | null
          subject?: string | null
        }
        Update: {
          content?: string
          id?: string
          image_url?: string | null
          is_archived?: boolean | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          sent_at?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean
          id: string
          phone_number: string | null
          sms_notifications: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean
          id?: string
          phone_number?: string | null
          sms_notifications?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean
          id?: string
          phone_number?: string | null
          sms_notifications?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      passkey_challenges: {
        Row: {
          challenge: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          challenge: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          payment_date: string | null
          payment_type: string | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          payment_date?: string | null
          payment_type?: string | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          payment_date?: string | null
          payment_type?: string | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          dj_name: string | null
          email: string
          first_name: string | null
          id: string
          is_mock: boolean
          last_name: string | null
          passkey_prompt_dismissed: boolean
          phone: string | null
          pronouns: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          dj_name?: string | null
          email: string
          first_name?: string | null
          id: string
          is_mock?: boolean
          last_name?: string | null
          passkey_prompt_dismissed?: boolean
          phone?: string | null
          pronouns?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          dj_name?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_mock?: boolean
          last_name?: string | null
          passkey_prompt_dismissed?: boolean
          phone?: string | null
          pronouns?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      progress_skills: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level: string
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level?: string
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level?: string
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      schedule_change_requests: {
        Row: {
          created_at: string | null
          id: string
          new_day: string
          new_time: string
          prev_day: string | null
          prev_time: string | null
          reason: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_day: string
          new_time: string
          prev_day?: string | null
          prev_time?: string | null
          reason?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          new_day?: string
          new_time?: string
          prev_day?: string | null
          prev_time?: string | null
          reason?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_change_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_absences: {
        Row: {
          absence_date: string
          class_id: string
          created_at: string | null
          id: string
          notified_instructor: boolean | null
          reason: string | null
          student_id: string
        }
        Insert: {
          absence_date: string
          class_id: string
          created_at?: string | null
          id?: string
          notified_instructor?: boolean | null
          reason?: string | null
          student_id: string
        }
        Update: {
          absence_date?: string
          class_id?: string
          created_at?: string | null
          id?: string
          notified_instructor?: boolean | null
          reason?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_absences_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      student_instructors: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          role: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          role?: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          role?: string
          student_id?: string
        }
        Relationships: []
      }
      student_makeups: {
        Row: {
          absence_date: string
          created_at: string
          id: string
          instructor_id: string
          makeup_date: string
          notes: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          absence_date: string
          created_at?: string
          id?: string
          instructor_id: string
          makeup_date: string
          notes?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          absence_date?: string
          created_at?: string
          id?: string
          instructor_id?: string
          makeup_date?: string
          notes?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          instructor_id: string
          is_read: boolean
          student_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          instructor_id: string
          is_read?: boolean
          student_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          instructor_id?: string
          is_read?: boolean
          student_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_personal_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          student_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          student_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          student_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      student_progress: {
        Row: {
          assessment_date: string | null
          assessor_id: string | null
          course_id: string
          id: string
          notes: string | null
          proficiency: number | null
          skill_name: string
          student_id: string
        }
        Insert: {
          assessment_date?: string | null
          assessor_id?: string | null
          course_id: string
          id?: string
          notes?: string | null
          proficiency?: number | null
          skill_name: string
          student_id: string
        }
        Update: {
          assessment_date?: string | null
          assessor_id?: string | null
          course_id?: string
          id?: string
          notes?: string | null
          proficiency?: number | null
          skill_name?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_status: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          set_at: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          set_at?: string
          status: string
          student_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          set_at?: string
          status?: string
          student_id?: string
        }
        Relationships: []
      }
      student_tasks: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          id: string
          instructor_id: string
          order_index: number
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          instructor_id: string
          order_index?: number
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          instructor_id?: string
          order_index?: number
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          class_day: string | null
          class_room: string | null
          class_time: string | null
          enrollment_status: string | null
          id: string
          instructor_id: string | null
          level: string | null
          notes: string | null
          start_date: string | null
          two_way_messaging: boolean
        }
        Insert: {
          class_day?: string | null
          class_room?: string | null
          class_time?: string | null
          enrollment_status?: string | null
          id: string
          instructor_id?: string | null
          level?: string | null
          notes?: string | null
          start_date?: string | null
          two_way_messaging?: boolean
        }
        Update: {
          class_day?: string | null
          class_room?: string | null
          class_time?: string | null
          enrollment_status?: string | null
          id?: string
          instructor_id?: string | null
          level?: string | null
          notes?: string | null
          start_date?: string | null
          two_way_messaging?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "students_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_passkeys: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          device_label: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[]
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[]
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          device_label?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_instructor: {
        Args: {
          initial_hourly_rate: number
          initial_status: string
          user_id: string
        }
        Returns: Json
      }
      assign_student_to_instructor: {
        Args: { _instructor_id: string; _student_id: string }
        Returns: Json
      }
      can_instructor_access_student: {
        Args: { _instructor_id: string; _student_id: string }
        Returns: boolean
      }
      create_demo_student: {
        Args: {
          email_address: string
          first_name: string
          last_name: string
          student_id: string
        }
        Returns: Json
      }
      delete_all_mock_users: { Args: never; Returns: Json }
      get_all_users: {
        Args: never
        Returns: {
          email: string
          first_name: string
          id: string
          last_name: string
          role: string
        }[]
      }
      get_instructor_counts: {
        Args: never
        Returns: {
          active: number
          inactive: number
          pending: number
          total: number
        }[]
      }
      get_instructors_with_profiles: {
        Args: { status_param: string }
        Returns: {
          bio: string
          hourly_rate: number
          id: string
          profile: Json
          specialties: string[]
          status: string
          years_experience: number
        }[]
      }
      get_profile_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_student_counts: {
        Args: never
        Returns: {
          active: number
          pending: number
          total: number
        }[]
      }
      get_students_with_instructors: {
        Args: { student_ids: string[] }
        Returns: {
          instructor_first_name: string
          instructor_id: string
          instructor_last_name: string
          student_id: string
        }[]
      }
      get_user_profile: {
        Args: { user_id: string }
        Returns: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          dj_name: string | null
          email: string
          first_name: string | null
          id: string
          is_mock: boolean
          last_name: string | null
          passkey_prompt_dismissed: boolean
          phone: string | null
          pronouns: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      set_mock_flag: {
        Args: { _is_mock: boolean; _user_ids: string[] }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "instructor" | "student"
      notification_channel: "email" | "push" | "all" | "none"
      user_role: "student" | "instructor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "instructor", "student"],
      notification_channel: ["email", "push", "all", "none"],
      user_role: ["student", "instructor", "admin"],
    },
  },
} as const
