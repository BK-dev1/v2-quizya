-- Remove title and description from attendance_sessions
-- Use module_name and section_group combination as the primary identifier

-- First, make sure all sessions have module_name (use title as fallback for existing ones)
UPDATE public.attendance_sessions
SET module_name = COALESCE(module_name, title)
WHERE module_name IS NULL OR module_name = '';

-- Now alter the table
ALTER TABLE public.attendance_sessions DROP COLUMN IF EXISTS title;
ALTER TABLE public.attendance_sessions DROP COLUMN IF EXISTS description;

-- Make module_name required since it's now the primary identifier
ALTER TABLE public.attendance_sessions ALTER COLUMN module_name SET NOT NULL;
