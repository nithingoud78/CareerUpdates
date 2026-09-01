-- Migration: Add download_file_name to career_tool_products

ALTER TABLE public.career_tool_products
ADD COLUMN download_file_name TEXT NULL;

-- Automatically strip extensions if provided, although our API will handle this
-- We just need the column.
