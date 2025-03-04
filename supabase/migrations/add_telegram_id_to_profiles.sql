
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
        
        -- Add an index on telegram_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);
        
        -- Log that we're adding the column
        RAISE NOTICE 'Adding telegram_id column to profiles table';
    ELSE
        RAISE NOTICE 'telegram_id column already exists in profiles table';
    END IF;
END
$$;
