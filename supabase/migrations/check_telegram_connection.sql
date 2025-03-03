
CREATE OR REPLACE FUNCTION public.check_telegram_connection(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  connection_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM user_telegram_connections 
    WHERE user_id = user_id_param
  ) INTO connection_exists;
  
  RETURN connection_exists;
END;
$$;
