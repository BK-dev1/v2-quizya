
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'exam_join',
    title VARCHAR(255) NOT NULL DEFAULT 'Notification',
    message TEXT,
    data JSONB DEFAULT '{}',
    exam_id UUID,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add all missing columns dynamically (for existing tables with different schema)
DO $$
BEGIN
    -- Add exam_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'exam_id') THEN
        ALTER TABLE notifications ADD COLUMN exam_id UUID;
    END IF;
    
    -- Add data column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'data') THEN
        ALTER TABLE notifications ADD COLUMN data JSONB DEFAULT '{}';
    END IF;
    
    -- Add message column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'message') THEN
        ALTER TABLE notifications ADD COLUMN message TEXT;
    END IF;
    
    -- Add type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE notifications ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'exam_join';
    END IF;
    
    -- Add title column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'title') THEN
        ALTER TABLE notifications ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Notification';
    END IF;
    
    -- Add read column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'read') THEN
        ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT false;
    END IF;
    
    -- Add created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'created_at') THEN
        ALTER TABLE notifications ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create indexes safely
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_notifications_exam_id ON notifications(exam_id); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_column THEN NULL; END $$;

-- RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid duplicates on re-run)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow insert notifications" ON notifications;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications" 
    ON notifications FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" 
    ON notifications FOR UPDATE 
    USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" 
    ON notifications FOR DELETE 
    USING (auth.uid() = user_id);

-- Service role or triggers can insert notifications for any user
CREATE POLICY "Allow insert notifications" 
    ON notifications FOR INSERT 
    WITH CHECK (true);

-- Enable realtime for notifications table (may fail if already enabled, that's ok)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- Function to create a notification (drop first to update)
DROP FUNCTION IF EXISTS create_notification(UUID, VARCHAR(50), VARCHAR(255), TEXT, JSONB, UUID);

CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT DEFAULT NULL,
    p_data JSONB DEFAULT '{}',
    p_exam_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data, exam_id)
    VALUES (p_user_id, p_type, p_title, p_message, p_data, p_exam_id)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint with all our notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('exam_join', 'proctoring_infraction', 'exam_submission', 'exam_started', 'exam_ended', 'info', 'warning', 'error', 'success'));

-- If there was an ENUM type, we need to allow our values
-- Update any existing notifications with incompatible types to 'info'
UPDATE notifications SET type = 'info' WHERE type NOT IN ('exam_join', 'proctoring_infraction', 'exam_submission', 'exam_started', 'exam_ended', 'info', 'warning', 'error', 'success');




-- Enable REPLICA IDENTITY FULL for detailed real-time events
ALTER TABLE notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;




ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Grant necessary permissions for realtime
GRANT SELECT ON notifications TO anon, authenticated;

-- Create a more permissive SELECT policy for authenticated users
-- This ensures Realtime can properly broadcast changes
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" 
    ON notifications FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id);

-- Also allow anon to view (for realtime to work in edge cases)
DROP POLICY IF EXISTS "Anon can view notifications" ON notifications;
CREATE POLICY "Anon can view notifications" 
    ON notifications FOR SELECT 
    TO anon
    USING (false); -- Anon users can't actually see any, but policy exists

-- Ensure the service role can always insert
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications" 
    ON notifications FOR INSERT 
    TO service_role
    WITH CHECK (true);

-- Allow authenticated users to receive realtime updates for their own notifications
-- This is a special policy that helps with realtime subscriptions
DROP POLICY IF EXISTS "Enable realtime for users" ON notifications;
