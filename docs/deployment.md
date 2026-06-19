# Deployment Guide

CareerUpdates is optimized for deployment on Vercel, utilizing Supabase for the database and authentication layers.

## Prerequisites

- A [Vercel](https://vercel.com/) account
- A [Supabase](https://supabase.com/) account
- An [OpenAI](https://openai.com/) account with API credits
- A GitHub repository containing the project codebase

## 1. Supabase Setup

1. Create a new project in your Supabase dashboard.
2. Navigate to the **SQL Editor** and run the initial migration scripts to create your tables (`jobs`, `companies`, `audit_logs`).
3. Configure **Authentication**:
   - Enable Email/Password authentication.
   - Create your first Admin user.
4. Set up **Row Level Security (RLS)**:
   - Allow public `SELECT` access to the `jobs` table where `status = 'published'`.
   - Restrict `INSERT`, `UPDATE`, `DELETE` to authenticated users with an `admin` role.
5. Go to **Project Settings > API** and note down your:
   - Project URL
   - `anon` `public` key
   - `service_role` key (keep this secret!)

## 2. Environment Variables

Prepare your environment variables. You will need these for Vercel.

```env
# Client-side Supabase keys
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Server-side keys
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# AI Keys
OPENAI_API_KEY=your_openai_api_key
AI_GATEWAY_API_KEY=your_ai_gateway_api_key

# App config
NODE_ENV=production
```

## 3. Vercel Deployment

1. Log into Vercel and click **Add New > Project**.
2. Import your GitHub repository.
3. Vercel should automatically detect the framework (or set the Build Command to `npm run build` and Output Directory to `.output` / `dist` depending on your exact TanStack Start config).
4. Expand the **Environment Variables** section and paste all the variables from Step 2.
5. Click **Deploy**.

## 4. Post-Deployment Checks

Once Vercel finishes the build:

1. Visit your new `.vercel.app` domain.
2. Verify the homepage loads correctly.
3. Navigate to the `/admin` route and attempt to log in using the Admin credentials you created in Supabase.
4. Try processing a test URL through the AI Import tool to ensure the Vercel Edge functions can successfully communicate with OpenAI and Supabase.

## Custom Domain Setup (Optional)

1. In Vercel, go to your project **Settings > Domains**.
2. Enter your custom domain (e.g., `careerupdates.com`).
3. Follow the Vercel instructions to configure your DNS records (A record or CNAME).
4. Vercel will automatically provision an SSL certificate.
