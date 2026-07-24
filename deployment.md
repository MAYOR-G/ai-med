# AI Med - Comprehensive Deployment Guide

This document is your step-by-step master plan for taking the AI Med prototype into a production-ready cloud deployment. We are using a robust modern stack:
- **Supabase**: Managed PostgreSQL database, Email OTP Authentication, and Document Storage.
- **Railway**: Fast, reliable hosting for our Python (FastAPI) backend.
- **Vercel**: Edge-optimized hosting for our React (Vite) frontend.
- **GitHub**: Version control and automatic deployment triggers.

---

## Step 1: Version Control (GitHub)
Before deploying, your code needs to be on GitHub. Vercel and Railway will automatically pull from your repository to deploy updates.

1. Go to [GitHub.com](https://github.com/) and create a new repository (e.g., `ai-med-app`).
2. Open your terminal in the root `ai-med` folder and run the following commands:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for AI Med"
   git branch -M main
   git remote add origin https://github.com/[YOUR-USERNAME]/[YOUR-REPO-NAME].git
   git push -u origin main
   ```
*(Make sure your `.gitignore` correctly ignores `.env` files so your secrets are not leaked to GitHub!)*

---

## Step 2: Supabase (Database, Auth, Storage)

### 2.1 Project Setup
1. Go to [Supabase](https://supabase.com/) and create an account.
2. Click **"New Project"**, select your organization, and name it "AI-Med".
3. Generate a strong Database Password and securely save it. Select a region close to your users.
4. Once the project finishes setting up, go to **Project Settings -> API** to find your **Project URL** and **anon public key**.

### 2.2 Configure Authentication (OTP)
1. On the left sidebar, click **Authentication**, then go to **Providers**.
2. Click on **Email**.
3. Enable **Confirm email**. This activates the OTP (One Time Password) feature. When users sign up or log in, Supabase will email them a 6-digit pin.
4. Disable **Enable passwordless sign-in** if you strictly want to use passwords, OR leave it enabled if you want to use "magic links" / OTP codes strictly.
5. In **Auth -> URL Configuration**, add your Vercel frontend URL (once you have it) to the **Site URL** and **Redirect URLs** so Supabase allows auth requests from your domain.

### 2.3 Configure Storage (For Medical Documents)
1. On the left sidebar, click **Storage**.
2. Click **New Bucket** and name it `medical-documents`.
3. Set the bucket to **Private** (we don't want anyone on the internet accessing medical records).
4. You will need to write Row Level Security (RLS) policies later to ensure users can only upload/download their *own* documents.

### 2.4 Configure Database Schema
1. On the left sidebar, click **SQL Editor**.
2. Create a new query and run the SQL needed to generate your tables (users, documents, etc.). You can dump this from your local SQLite or use Alembic migrations.

---

## Step 3: Railway (Backend Deployment)

We use Railway for the FastAPI backend because it handles Python environments beautifully.

### 3.1 Initial Setup
1. Go to [Railway.app](https://railway.app/) and log in with your GitHub account.
2. Click **"New Project"** -> **"Deploy from GitHub repo"**.
3. Select your `ai-med-app` repository.
4. When prompted, select the **`/backend`** folder as the root directory for this specific deployment.

### 3.2 Environment Variables
1. Go to the newly created service in Railway, click on the **Variables** tab.
2. Add the following variables (referencing the values from your Supabase dashboard and local `.env`):
   - `APP_ENV=production`
   - `SECRET_KEY=[Generate-a-secure-random-string]`
   - `DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres` (Get this from Supabase -> Settings -> Database -> Connection string)
   - `SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co`
   - `SUPABASE_ANON_KEY=[Your-Anon-Key]`
   - `SUPABASE_JWT_SECRET=[Your-JWT-Secret]` (Found in Supabase -> Settings -> API -> JWT Secret)
   - `GEMINI_API_KEY=[Your-Gemini-Key]`
   - `ALLOWED_ORIGINS=https://[YOUR-VERCEL-FRONTEND-URL]` (You can add the Vercel URL here once it's created)

### 3.3 Build and Start Commands
Railway usually detects Python (FastAPI) automatically via the `pyproject.toml` or `requirements.txt`.
1. Go to the **Settings** tab of the Railway service.
2. Scroll to the **Deploy** section.
3. If it fails to auto-detect, set the **Start Command** to:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
4. Railway will automatically generate a public domain (e.g., `https://ai-med-production.up.railway.app`). Copy this URL.

---

## Step 4: Vercel (Frontend Deployment)

We use Vercel because it provides the best out-of-the-box hosting and CDN for Vite/React applications.

### 4.1 Initial Setup
1. Go to [Vercel.com](https://vercel.com/) and log in with GitHub.
2. Click **"Add New..." -> "Project"**.
3. Import your `ai-med-app` repository from GitHub.

### 4.2 Configuration
1. In the "Configure Project" step, click **Edit** next to "Root Directory" and select **`frontend`**.
2. The "Framework Preset" should automatically detect **Vite**. If not, select it manually.
3. Expand the **Environment Variables** section and add the following:
   - `VITE_API_BASE_URL=https://[YOUR-RAILWAY-APP-URL]/api/v1` (The URL you got from Railway in step 3)
   - `VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co` (From Supabase)
   - `VITE_SUPABASE_ANON_KEY=[Your-Anon-Key]` (From Supabase)

### 4.3 Deploy
1. Click **Deploy**. Vercel will build the frontend (`npm run build`) and serve the `dist/` directory on their global edge network.
2. Once complete, Vercel will give you a public URL (e.g., `https://ai-med-app.vercel.app`).
3. **IMPORTANT**: Take this Vercel URL and do two things:
   - Go back to **Railway**, update the `ALLOWED_ORIGINS` variable to include this URL (so CORS doesn't block the frontend).
   - Go back to **Supabase** (Auth -> URL Configuration) and add this URL to the **Site URL** and **Redirect URLs**.

---

## Step 5: Final Testing
1. Visit your live Vercel URL.
2. Attempt to sign up. You should receive an email with an OTP pin from Supabase.
3. Enter the pin, verify you are logged in.
4. Try uploading a document. The backend (on Railway) should receive it, save it (to Supabase Storage), and process it.
5. Attempt a chat query to ensure the Gemini API is responding correctly through the Railway backend.

Congratulations! Your AI Med platform is now live and in production!
