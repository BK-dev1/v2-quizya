-- QUIZYA COMPLETE DATABASE SCHEMA
-- This script contains the full database structure, including types, tables, RLS policies, functions, and triggers.
-- Run this in the Supabase SQL Editor.
-- ==========================================
-- 1. Create Custom Types
-- ==========================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('teacher', 'student');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
        CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
        CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE session_status AS ENUM ('not_started', 'in_progress', 'completed', 'abandoned');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_status') THEN
        CREATE TYPE exam_status AS ENUM ('upcoming', 'active', 'ended');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
-- ==========================================
-- 2. Create Tables
-- ==========================================
-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    passing_score INTEGER NOT NULL,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    room_code TEXT UNIQUE,
    status exam_status NOT NULL DEFAULT 'upcoming',
    proctoring_enabled BOOLEAN DEFAULT false,
    shuffle_questions BOOLEAN DEFAULT false,
    show_results_immediately BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL,
    time_limit INTEGER, -- Optional limit per question in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Exam Sessions Table
CREATE TABLE IF NOT EXISTS exam_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    guest_name TEXT,
    guest_email TEXT,
    is_guest BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    score DECIMAL(5,2),
    total_points INTEGER NOT NULL,
    status session_status DEFAULT 'not_started',
    answers JSONB,
    proctoring_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_exam_participant UNIQUE(exam_id, student_id, guest_email)
);
-- Question Bank Table
CREATE TABLE IF NOT EXISTS question_bank (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    difficulty_level difficulty_level NOT NULL,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    tags TEXT[],
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_exam_start BOOLEAN DEFAULT true,
    email_submissions BOOLEAN DEFAULT true,
    email_weekly_report BOOLEAN DEFAULT false,
    push_exam_start BOOLEAN DEFAULT true,
    push_infractions BOOLEAN DEFAULT true,
    push_submissions BOOLEAN DEFAULT false,
    compact_mode BOOLEAN DEFAULT false,
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    session_timeout_minutes INTEGER DEFAULT 30,
    two_factor_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);
-- ==========================================
-- 3. Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);
CREATE INDEX IF NOT EXISTS idx_exams_room_code ON exams(room_code) WHERE room_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(exam_id, order_index);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_id ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_id ON exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_question_bank_created_by ON question_bank(created_by);
CREATE INDEX IF NOT EXISTS idx_question_bank_subject ON question_bank(subject);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON question_bank(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_question_bank_tags ON question_bank USING GIN(tags);
-- ==========================================
-- 4. Key Security (RLS)
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- Exams Policies
-- FIX: Allow selection by room_code for guests to join
DROP POLICY IF EXISTS "Public exams are viewable by everyone" ON exams;
DROP POLICY IF EXISTS "Exams are viewable by everyone if public/teacher/room_code" ON exams;
CREATE POLICY "Exams are viewable by everyone if public/teacher/room_code" ON exams
    FOR SELECT USING (is_public = true OR created_by = auth.uid() OR room_code IS NOT NULL);
DROP POLICY IF EXISTS "Teachers can create exams" ON exams;
CREATE POLICY "Teachers can create exams" ON exams FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
DROP POLICY IF EXISTS "Teachers can update their own exams" ON exams;
CREATE POLICY "Teachers can update their own exams" ON exams FOR UPDATE USING (created_by = auth.uid());
DROP POLICY IF EXISTS "Teachers can delete their own exams" ON exams;
CREATE POLICY "Teachers can delete their own exams" ON exams FOR DELETE USING (created_by = auth.uid());
-- Questions Policies
DROP POLICY IF EXISTS "Questions viewable by exam creators and students taking exam" ON questions;
DROP POLICY IF EXISTS "Questions viewable by exam creators and students" ON questions;
CREATE POLICY "Questions viewable by exam creators and students" ON questions
    FOR SELECT USING (EXISTS (SELECT 1 FROM exams WHERE exams.id = questions.exam_id AND (exams.created_by = auth.uid() OR exams.is_public = true OR exams.room_code IS NOT NULL)));
DROP POLICY IF EXISTS "Teachers can manage questions for their exams" ON questions;
CREATE POLICY "Teachers can manage questions for their exams" ON questions FOR ALL USING (EXISTS (SELECT 1 FROM exams WHERE exams.id = questions.exam_id AND exams.created_by = auth.uid()));
-- Exam Sessions Policies
DROP POLICY IF EXISTS "Users can view their own exam sessions" ON exam_sessions;
CREATE POLICY "Users can view their own exam sessions" ON exam_sessions FOR SELECT USING (student_id = auth.uid() OR is_guest = true OR EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_sessions.exam_id AND exams.created_by = auth.uid()));
DROP POLICY IF EXISTS "Students and guests can create exam sessions" ON exam_sessions;
CREATE POLICY "Students and guests can create exam sessions" ON exam_sessions FOR INSERT WITH CHECK ((student_id = auth.uid() AND NOT is_guest) OR (is_guest = true AND guest_name IS NOT NULL AND guest_email IS NOT NULL));
DROP POLICY IF EXISTS "Students and guests can update their own exam sessions" ON exam_sessions;
CREATE POLICY "Students and guests can update their own exam sessions" ON exam_sessions FOR UPDATE USING ((student_id = auth.uid() AND NOT is_guest) OR (is_guest = true));
-- Question Bank Policies
DROP POLICY IF EXISTS "Question bank viewable by creators and teachers" ON question_bank;
CREATE POLICY "Question bank viewable by creators and teachers" ON question_bank FOR SELECT USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
DROP POLICY IF EXISTS "Teachers can manage question bank" ON question_bank;
CREATE POLICY "Teachers can manage question bank" ON question_bank FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
-- User Settings Policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
-- ==========================================
-- 5. Functions and Triggers
-- ==========================================
-- Trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_exam_sessions_updated_at BEFORE UPDATE ON exam_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_question_bank_updated_at BEFORE UPDATE ON question_bank FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Function to handle new user registration profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name',
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION generate_room_code(length INTEGER DEFAULT 6)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
-- ==========================================
-- 6. Real-time Configuration
-- ==========================================
-- Enable REPLICA IDENTITY FULL for detailed real-time events on exam_sessions
ALTER TABLE exam_sessions REPLICA IDENTITY FULL;
-- Ensure exam_sessions is in the realtime publication
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'exam_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE exam_sessions;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'exams'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE exams;
  END IF;
END $$;