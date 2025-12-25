-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.exam_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL,
  student_id uuid,
  guest_name text,
  guest_email text,
  is_guest boolean DEFAULT false,
  started_at timestamp with time zone,
  submitted_at timestamp with time zone,
  score numeric,
  total_points integer NOT NULL,
  status USER-DEFINED DEFAULT 'not_started'::session_status,
  answers jsonb,
  proctoring_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exam_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT exam_sessions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id),
  CONSTRAINT exam_sessions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.exams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  total_questions integer NOT NULL,
  passing_score integer NOT NULL,
  is_public boolean DEFAULT false,
  is_active boolean DEFAULT true,
  room_code text UNIQUE,
  status USER-DEFINED NOT NULL DEFAULT 'upcoming'::exam_status,
  proctoring_enabled boolean DEFAULT false,
  shuffle_questions boolean DEFAULT false,
  show_results_immediately boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exams_pkey PRIMARY KEY (id),
  CONSTRAINT exams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  role USER-DEFINED DEFAULT 'student'::user_role,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.question_bank (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject text,
  difficulty_level USER-DEFINED NOT NULL,
  question_text text NOT NULL,
  question_type USER-DEFINED NOT NULL,
  options jsonb,
  correct_answer text NOT NULL,
  explanation text,
  tags ARRAY,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT question_bank_pkey PRIMARY KEY (id),
  CONSTRAINT question_bank_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL,
  question_text text NOT NULL,
  question_type USER-DEFINED NOT NULL,
  options jsonb,
  correct_answer text NOT NULL,
  points integer DEFAULT 1,
  order_index integer NOT NULL,
  time_limit integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id)
);
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_exam_start boolean DEFAULT true,
  email_submissions boolean DEFAULT true,
  email_weekly_report boolean DEFAULT false,
  push_exam_start boolean DEFAULT true,
  push_infractions boolean DEFAULT true,
  push_submissions boolean DEFAULT false,
  compact_mode boolean DEFAULT false,
  theme character varying DEFAULT 'system'::character varying,
  language character varying DEFAULT 'en'::character varying,
  timezone character varying DEFAULT 'America/New_York'::character varying,
  date_format character varying DEFAULT 'MM/DD/YYYY'::character varying,
  session_timeout_minutes integer DEFAULT 30,
  two_factor_enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);