
-- Add telegram_id column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'telegram_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN telegram_id TEXT;
    END IF;
END
$$;
