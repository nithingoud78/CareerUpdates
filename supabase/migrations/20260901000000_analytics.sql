-- =============================================================================
-- ANALYTICS SYSTEM MIGRATION
-- Career Updates - Privacy-first analytics tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT        NOT NULL CHECK (event_type IN (
                'page_view', 'job_view', 'blog_view', 'search', 'apply_click',
                'company_view', 'category_view'
              )),
  visitor_id  TEXT        NOT NULL CHECK (char_length(visitor_id) <= 36),
  session_id  TEXT        NOT NULL CHECK (char_length(session_id) <= 36),
  path        TEXT        NOT NULL CHECK (char_length(path) <= 500),
  job_id      UUID        REFERENCES public.jobs(id) ON DELETE SET NULL,
  blog_id     UUID        REFERENCES public.blogs(id) ON DELETE SET NULL,
  search_query TEXT       CHECK (search_query IS NULL OR char_length(search_query) <= 500),
  referrer    TEXT        CHECK (referrer IS NULL OR char_length(referrer) <= 200),
  device_type TEXT        CHECK (device_type IS NULL OR device_type IN ('mobile', 'desktop', 'tablet')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_created_at_idx   ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_event_type_idx   ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS analytics_job_id_idx       ON public.analytics_events (job_id) WHERE job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_blog_id_idx      ON public.analytics_events (blog_id) WHERE blog_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_visitor_id_idx   ON public.analytics_events (visitor_id);
CREATE INDEX IF NOT EXISTS analytics_session_id_idx   ON public.analytics_events (session_id);

GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL    ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_analytics"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admin_select_analytics"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));