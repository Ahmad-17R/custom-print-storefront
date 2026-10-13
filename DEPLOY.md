# Deploying the storefront (Vercel)

Full guide (backend first): see `DEPLOY.md` in the `custom-print-backend` repo.

1. Deploy the backend on Render first and copy its URL (e.g. `https://custom-print-api.onrender.com`).
2. https://vercel.com → **Add New → Project** → import this repo. Build settings come from `vercel.json`.
3. Environment Variables:
   - `VITE_API_URL` = the Render URL (no trailing slash)
   - `VITE_LOCAL_AUTH` = `true` (must match `LOCAL_AUTH` on Render)
4. **Deploy**, then open `/admin` → `SuperAdmin` / `1234` → change the password.

Changing an env var needs a **Redeploy** (Vite bakes them in at build time).
