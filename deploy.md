# 🚀 Deployment Guide: Agentflow AI

This guide walks you through deploying **Agentflow AI** to production:
- **Backend**: Hosted on **Render** (Node.js Web Service)
- **Frontend**: Hosted on **Vercel** (Next.js Application)
- **Database**: **MongoDB Atlas**

---

## 📋 Step 1: Push Code to GitHub

Make sure your project files are committed to a GitHub repository.

1. Open your terminal in the root project folder:
   ```bash
   # Initialize git repository (if not already initialized)
   git init

   # Stage all files (.gitignore will protect your node_modules and .env files)
   git add .

   # Commit changes
   git commit -m "feat: complete full-stack Agentflow AI platform"

   # Set branch name to main
   git branch -M main

   # Link your GitHub repository (replace with your repo URL)
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git

   # Push to GitHub
   git push -u origin main
   ```

---

## 🛠️ Step 2: Deploy Backend on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** &rarr; **Web Service**.
2. Connect your GitHub account and select your repository.
3. Configure the Web Service settings:
   - **Name**: `agentflow-backend` (or your preferred name)
   - **Region**: Select the closest region (e.g., *Oregon (US West)* or *Frankfurt (EU)*)
   - **Root Directory**: `server` ⚠️ *(Important: specify `server`)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Instance Type**: `Free`

4. Scroll down to **Environment Variables** and add the following:

| Key | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Production environment |
| `PORT` | `10000` | (Render sets this automatically, default 5000/10000) |
| `JWT_SECRET` | `super_secret_jwt_key_agentflow_ai_2026_secure` | Any random 32+ char secret |
| `JWT_EXPIRES_IN` | `7d` | Token validity |
| `CREDENTIAL_ENCRYPTION_KEY` | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` | 32-byte hex encryption key |
| `MONGODB_URI` | `mongodb+srv://<db_username>:<db_password>@agenticai.0iqicpo.mongodb.net/agentflow?retryWrites=true&w=majority&appName=AgenticAi` | Your MongoDB Atlas connection URI |
| `GEMINI_API_KEY` | `YOUR_GEMINI_API_KEY` | (Optional: for Google Gemini AI generation) |
| `OPENROUTER_API_KEY` | `YOUR_OPENROUTER_API_KEY` | (Optional: for Claude 3.5 Sonnet generation) |
| `CLIENT_URL` | `https://YOUR-VERCEL-FRONTEND-URL.vercel.app` | (Update this after deploying to Vercel in Step 3) |

5. Click **Create Web Service**.
6. Wait for Render to build and deploy. Once live, copy your **Render Service URL** (e.g., `https://agentflow-backend.onrender.com`).
7. Test your backend health endpoint in your browser:
   ```
   https://agentflow-backend.onrender.com/api/health
   ```

---

## ⚡ Step 3: Deploy Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Select **Import Git Repository** and choose your repository.
3. Configure the Project:
   - **Project Name**: `agentflow-ai`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and choose `client` ⚠️ *(Important: select the `client` folder)*

4. Expand **Environment Variables** and add:

| Key | Value | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RENDER-URL.onrender.com/api` | `https://agentflow-backend.onrender.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://YOUR-RENDER-URL.onrender.com` | `https://agentflow-backend.onrender.com` |

5. Click **Deploy**.
6. Vercel will build and publish your Next.js application in ~1-2 minutes.
7. Copy your production Vercel URL (e.g., `https://agentflow-ai.vercel.app`).

---

## 🔄 Step 4: Link Frontend URL back to Render

1. Go back to your [Render Dashboard](https://dashboard.render.com/) &rarr; select `agentflow-backend`.
2. Go to **Environment** in the left menu.
3. Update `CLIENT_URL` to your production Vercel URL:
   ```
   CLIENT_URL = https://agentflow-ai.vercel.app
   ```
4. Click **Save Changes**. Render will automatically redeploy with the updated CORS configuration.

---

## ✅ Step 5: Verify Production Deployment

1. Open your Vercel URL (`https://agentflow-ai.vercel.app`) in your browser.
2. Sign in using the **1-Click Instant Demo Login** or create a new account.
3. Go to **AI Builder** (`/workflows/builder`), enter an automation prompt, and generate a workflow.
4. Open the workflow on the visual canvas and click **Run Execution**.
5. Watch the live **Socket.IO** agent stream in real time.

---

## 💡 Troubleshooting & Notes

- **Render Free Tier Spin-up**: Render free instances enter sleep mode after 15 minutes of inactivity. When accessed after being idle, the first request may take ~30-50 seconds to wake up.
- **MongoDB Atlas Whitelist**: Ensure MongoDB Atlas has `0.0.0.0/0` whitelisted under **Network Access** so Render's dynamic IPs can connect.
- **WebSocket / Socket.IO**: Socket.IO automatically uses polling fallback if WebSockets are temporarily blocked by corporate firewalls.
