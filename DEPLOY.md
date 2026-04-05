# TISA — Netlify Deployment Guide

Complete step-by-step instructions from zero to live URL.

---

## Prerequisites

- A free [Netlify account](https://app.netlify.com/signup)
- A free [GitHub account](https://github.com)
- [Git](https://git-scm.com/downloads) installed on your machine
- [Node.js 20+](https://nodejs.org) installed on your machine

---

## Step 1 — Prepare the project locally

Open your terminal and run these commands:

```bash
# 1. Unzip the project
unzip tisa-ai.zip
cd tisa

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Verify it builds with zero errors
npm run build
```

You should see output ending with:
```
✓ Compiled successfully
Route (app)   Size   First Load JS
┌ ○ /         ...
```

If the build passes, proceed. If not, see the Troubleshooting section at the bottom.

---

## Step 2 — Push to GitHub

```bash
# 1. Initialise a git repo inside the tisa folder
git init

# 2. Stage all files
git add .

# 3. Commit
git commit -m "Initial TISA commit"

# 4. Create a new repo on GitHub:
#    Go to https://github.com/new
#    Name it: tisa-ai
#    Set to Public or Private (both work with Netlify free tier)
#    Do NOT initialise with README (you already have one)
#    Click "Create repository"

# 5. Copy the repo URL GitHub gives you, then run:
git remote add origin https://github.com/YOUR_USERNAME/tisa-ai.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Connect to Netlify

### Option A — Netlify UI (easiest)

1. Go to [app.netlify.com](https://app.netlify.com) and log in
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Authorise Netlify to access your GitHub account
5. Search for and select your **tisa-ai** repository
6. Netlify will auto-detect the settings. Verify they match:

   | Setting | Value |
   |---|---|
   | **Base directory** | *(leave blank)* |
   | **Build command** | `npm run build` |
   | **Publish directory** | `.next` |
   | **Node version** | `20` |

7. Click **"Deploy tisa-ai"**

Netlify will now build and deploy. The first deploy takes 2–4 minutes.

### Option B — Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Log in
netlify login

# Inside the tisa project folder:
netlify init

# Follow the prompts:
#   ? What would you like to do? → Create & configure a new site
#   ? Team: → (your account)
#   ? Site name: → tisa-ai (or leave blank for random name)
#   ? Build command: → npm run build
#   ? Directory to deploy: → .next

# Deploy
netlify deploy --prod
```

---

## Step 4 — Add the Netlify Next.js plugin

The `@netlify/plugin-nextjs` plugin is already declared in `netlify.toml`.
Netlify installs it automatically — no action needed.

If you see a warning about it during the build, install it manually:

```bash
npm install -D @netlify/plugin-nextjs --legacy-peer-deps
git add package.json package-lock.json
git commit -m "Add netlify next.js plugin"
git push
```

---

## Step 5 — Set required HTTP headers

The COOP/COEP headers are critical for WebGPU and SharedArrayBuffer (needed by WebLLM).
They are already configured in `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy   = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
```

To verify they are live after deployment:
1. Open your deployed TISA URL in Chrome
2. Open DevTools → Network tab
3. Click any request → Headers tab
4. Confirm `cross-origin-opener-policy: same-origin` is present

---

## Step 6 — Verify the deployment

1. Click the URL Netlify gives you (e.g. `https://tisa-ai-abc123.netlify.app`)
2. The TISA welcome screen should appear
3. Type a message and check the AI responds
4. Open DevTools → Console and confirm no red errors

### Check AI tier detection

Open DevTools → Console and look for:
- `[TISA] Tier 1 active` = Gemini Nano via window.ai (Chrome only)
- `[TISA] Tier 2 active` = WebLLM via WebGPU
- `[TISA] Tier 3 active` = CPU fallback (always works)

---

## Step 7 — Set a custom domain (optional)

1. In Netlify dashboard → **Domain settings** → **Add custom domain**
2. Enter your domain (e.g. `tisa.yourdomain.com`)
3. Follow DNS instructions (add a CNAME record pointing to your Netlify URL)
4. Netlify auto-provisions a free SSL certificate via Let's Encrypt

---

## Continuous deployment

After the initial setup, every `git push` to the `main` branch automatically triggers a new Netlify build and deploy. No further action needed.

```bash
# Make a change, then:
git add .
git commit -m "Update something"
git push
# Netlify detects the push and rebuilds automatically
```

---

## Environment variables (if needed later)

If you add server-side features, set env vars in Netlify:
1. **Site settings** → **Environment variables** → **Add variable**
2. Or use the CLI: `netlify env:set KEY value`

TISA currently has no required env vars — it runs 100% client-side.

---

## Troubleshooting

### Build fails: "Cannot find module 'next-pwa'"
The project no longer uses next-pwa. If you have an old version of the project, delete it and use the latest zip.

### Build fails: "ESM / module type" error
Make sure your `next.config.js` has the `transpilePackages` array. The latest zip includes this.

### Build fails: TypeScript errors
Run locally first:
```bash
npx tsc --noEmit
```
Fix any errors, commit, and push again.

### Site loads but AI shows "Tier 3 / CPU mode" on desktop
WebGPU requires a real GPU. On Netlify preview environments or low-end machines, Tier 3 (CPU) is expected. The UI still works fully.

### "SharedArrayBuffer is not defined" error
The COOP/COEP headers are missing. Verify your `netlify.toml` is committed and the headers appear in the deployed response (check DevTools → Network).

### Voice input not working
Voice requires HTTPS. Netlify always serves over HTTPS so this should work automatically. If testing locally, use `npm run dev` (Next.js dev server also supports it on localhost).

### PDF upload not working
Browser must support the File API (all modern browsers do). If the file appears to hang, check the Console for WASM errors — WASM needs the COEP header to be set.

---

## Build settings reference

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `.next` |
| Node version | `20` |
| NPM flags | `--legacy-peer-deps` |
| Plugin | `@netlify/plugin-nextjs` |
| COOP header | `same-origin` |
| COEP header | `require-corp` |

---

*TISA runs 100% client-side. Netlify serves the static shell and Next.js routes. All AI inference happens in the user's browser — no server compute cost.*
