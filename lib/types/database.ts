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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          username: string | null
          institution: string | null
          department: string | null
          bio: string | null
          avatar_url: string | null
          role: 'teacher' | 'student'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          username?: string | null
          institution?: string | null
          department?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: 'teacher' | 'student'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          username?: string | null
          institution?: string | null
          department?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: 'teacher' | 'student'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          id: string
          title: string
          description: string | null
          duration_minutes: number
          total_questions: number
          passing_score: number
          is_public: boolean
          is_active: boolean
          room_code: string | null
          proctoring_enabled: boolean
          shuffle_questions: boolean
          show_results_immediately: boolean
          status: 'upcoming' | 'active' | 'ended'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          duration_minutes: number
          total_questions: number
          passing_score: number
          is_public?: boolean
          is_active?: boolean
          room_code?: string | null
          proctoring_enabled?: boolean
          shuffle_questions?: boolean
          show_results_immediately?: boolean
          status?: 'upcoming' | 'active' | 'ended'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          duration_minutes?: number
          total_questions?: number
          passing_score?: number
          is_public?: boolean
          is_active?: boolean
          room_code?: string | null
          proctoring_enabled?: boolean
          shuffle_questions?: boolean
          show_results_immediately?: boolean
          status?: 'upcoming' | 'active' | 'ended'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          id: string
          exam_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options: Json | null
          correct_answer: string
          points: number
          order_index: number
          time_limit: number | null
          keywords: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options?: Json | null
          correct_answer: string
          points: number
          order_index: number
          time_limit?: number | null
          keywords?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options?: Json | null
          correct_answer?: string
          points?: number
          order_index?: number
          time_limit?: number | null
          keywords?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          }
        ]
      }
      exam_sessions: {
        Row: {
          id: string
          exam_id: string
          student_id: string | null
          guest_name: string | null
          guest_email: string | null
          is_guest: boolean
          started_at: string | null
          submitted_at: string | null
          score: number | null
          total_points: number
          status: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
          grading_status: 'pending' | 'graded' | 'not_required'
          answers: Json | null
          proctoring_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          student_id?: string | null
          guest_name?: string | null
          guest_email?: string | null
          is_guest?: boolean
          started_at?: string | null
          submitted_at?: string | null
          score?: number | null
          total_points: number
          status?: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
          grading_status?: 'pending' | 'graded' | 'not_required'
          answers?: Json | null
          proctoring_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          student_id?: string | null
          guest_name?: string | null
          guest_email?: string | null
          is_guest?: boolean
          started_at?: string | null
          submitted_at?: string | null
          score?: number | null
          total_points?: number
          status?: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
          grading_status?: 'pending' | 'graded' | 'not_required'
          answers?: Json | null
          proctoring_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      question_bank: {
        Row: {
          id: string
          title: string
          description: string | null
          subject: string | null
          difficulty_level: 'easy' | 'medium' | 'hard'
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options: Json | null
          correct_answer: string
          explanation: string | null
          tags: string[] | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          subject?: string | null
          difficulty_level: 'easy' | 'medium' | 'hard'
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options?: Json | null
          correct_answer: string
          explanation?: string | null
          tags?: string[] | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          subject?: string | null
          difficulty_level?: 'easy' | 'medium' | 'hard'
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options?: Json | null
          correct_answer?: string
          explanation?: string | null
          tags?: string[] | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          email_exam_start: boolean | null
          email_submissions: boolean | null
          email_weekly_report: boolean | null
          push_exam_start: boolean | null
          push_infractions: boolean | null
          push_submissions: boolean | null
          compact_mode: boolean | null
          theme: string | null
          language: string | null
          timezone: string | null
          date_format: string | null
          session_timeout_minutes: number | null
          two_factor_enabled: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_exam_start?: boolean | null
          email_submissions?: boolean | null
          email_weekly_report?: boolean | null
          push_exam_start?: boolean | null
          push_infractions?: boolean | null
          push_submissions?: boolean | null
          compact_mode?: boolean | null
          theme?: string | null
          language?: string | null
          timezone?: string | null
          date_format?: string | null
          session_timeout_minutes?: number | null
          two_factor_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_exam_start?: boolean | null
          email_submissions?: boolean | null
          email_weekly_report?: boolean | null
          push_exam_start?: boolean | null
          push_infractions?: boolean | null
          push_submissions?: boolean | null
          compact_mode?: boolean | null
          theme?: string | null
          language?: string | null
          timezone?: string | null
          date_format?: string | null
          session_timeout_minutes?: number | null
          two_factor_enabled?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      attendance_sessions: {
        Row: {
          id: string
          title: string
          description: string | null
          teacher_id: string
          module_name: string | null
          section_group: string | null
          location_lat: number | null
          location_lng: number | null
          max_distance_meters: number
          qr_refresh_interval: number
          is_active: boolean
          started_at: string
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          teacher_id: string
          module_name?: string | null
          section_group?: string | null
          location_lat?: number | null
          location_lng?: number | null
          max_distance_meters?: number
          qr_refresh_interval?: number
          is_active?: boolean
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          teacher_id?: string
          module_name?: string | null
          section_group?: string | null
          location_lat?: number | null
          location_lng?: number | null
          max_distance_meters?: number
          qr_refresh_interval?: number
          is_active?: boolean
          started_at?: string
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      attendance_records: {
        Row: {
          id: string
          session_id: string
          student_name: string
          student_email: string | null
          check_in_time: string
          location_lat: number | null
          location_lng: number | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          student_name: string
          student_email?: string | null
          check_in_time?: string
          location_lat?: number | null
          location_lng?: number | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          student_name?: string
          student_email?: string | null
          check_in_time?: string
          location_lat?: number | null
          location_lng?: number | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}