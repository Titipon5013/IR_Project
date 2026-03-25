# Food Assemble Frontend

Next.js (App Router) frontend for Food Assemble.

## Environment setup

Create `frontend/.env.local` from `frontend/.env.example` and fill values:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

Important:
- Do not put Google Client Secret in frontend env.
- `NEXT_PUBLIC_*` values are public by design (sent to browser).

## Google OAuth setup (Supabase)

If you see `Unsupported provider: provider is not enabled`, Google provider is not enabled in Supabase yet.

1. Supabase Dashboard -> Authentication -> Providers -> Google -> Enable
2. Set Google Client ID and Google Client Secret there (in Supabase dashboard only)
3. In Google Cloud Console, add Authorized redirect URI:
   - `https://qjauqcichhhxzlmnqaap.supabase.co/auth/v1/callback`
4. In Supabase Auth URL config, ensure Site URL includes:
   - `http://localhost:3000`

## Run locally

```bash
npm install
npm run dev
```
