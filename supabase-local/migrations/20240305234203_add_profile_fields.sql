-- Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS service_type TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Update the handle_new_user function to match the table schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        profession,
        service_type,
        referral_source,
        company_name
    )
    VALUES (
        new.id,
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name',
        new.raw_user_meta_data->>'profession',
        new.raw_user_meta_data->>'service_type',
        new.raw_user_meta_data->>'referral_source',
        new.raw_user_meta_data->>'company_name'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 