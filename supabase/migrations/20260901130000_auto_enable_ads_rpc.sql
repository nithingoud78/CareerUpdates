CREATE OR REPLACE FUNCTION auto_enable_ads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE site_settings
  SET ads_enabled = true,
      ads_disabled_at = null,
      ads_auto_enable_at = null
  WHERE ads_enabled = false 
    AND ads_auto_enable_at <= now();
END;
$$;

-- Allow anonymous and authenticated users to execute the function
GRANT EXECUTE ON FUNCTION auto_enable_ads() TO anon, authenticated;
