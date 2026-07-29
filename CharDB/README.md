# CharDB

CharDB is a Supabase-backed character sheet host for Arelith planning.

- Account sign-up / sign-in with Supabase Auth
- Discord OAuth sign-in with Supabase Auth
- Per-user sheet storage
- Level 1-30 progression rows with class, feats, skills, and notes
- Intentionally does not validate build legality

## Setup

1. Open your Supabase project SQL Editor.
2. Run [schema.sql](schema.sql).
3. Configure [supabase.config.js](supabase.config.js):

```js
window.CHARDB_SUPABASE_CONFIG = {
  url: "https://kwmeabqtjphcbpxkjjxn.supabase.co",
  anonKey: "PASTE_PUBLISHABLE_KEY_HERE",
  persistSession: true
};
```

4. Start the local site and open `CharDB/index.html`.

Users are not asked for any keys in the UI. Only this one-time admin config is needed.

## Discord Auth Setup

CharDB uses `signInWithOAuth({ provider: "discord" })`.

1. Create a Discord application at https://discord.com/developers/applications
2. In Discord app settings:
  - Go to **OAuth2**
  - Add Redirect URI: `https://kwmeabqtjphcbpxkjjxn.supabase.co/auth/v1/callback`
3. In Supabase Dashboard for your project:
  - Go to **Authentication -> Providers -> Discord**
  - Enable Discord provider
  - Paste Discord **Client ID** and **Client Secret**
4. In Supabase Dashboard:
  - Go to **Authentication -> URL Configuration**
  - Add Site URL for production host
  - Add additional redirect URLs for each environment, such as:
    - `http://localhost:8000/CharDB/index.html`
    - your GitHub Pages CharDB URL (if hosting there)

After this, users click "Sign in with Discord" and are redirected back to CharDB.

## Reusing Portrait Uploader Keys

Use the same values as Portrait Uploader frontend config:

- `url`: your Supabase project URL (already set)
- `anonKey`: your frontend publishable key (legacy name: anon key)

If you cannot find those values in Portrait Uploader:

1. Supabase Dashboard -> Project Settings -> API.
2. Copy **Project URL** and **Publishable key**.
3. Paste into [supabase.config.js](supabase.config.js).

## Important Security Notes

- Never put `service_role` or secret API keys in browser code.
- Do not share service-role keys with this app or with end users.
- Keep RLS enabled on `public.character_sheets`.
- This app only reads/writes rows where `auth.uid() = user_id`.

## Auth Notes

- Discord provider must be enabled in Supabase Auth providers.

## Runtime Data For Git Hosting

CharDB now uses local runtime data files so deployment does not depend on sibling folders being served:

- [data/classCombatMeta.json](data/classCombatMeta.json)
- [data/raceFeatsMeta.json](data/raceFeatsMeta.json)

If source data changes, rebuild these files from the repo root:

```bash
node CharDB/build-runtime-data.js
```

At runtime, CharDB loads local data first and only falls back to external source files if local files are unavailable.

## Public Vs Private Sheets

Sheets now support a visibility toggle:

- `Private`: only owner can see/edit.
- `Public`: still editable only by owner, but visible in Public Search.

Public search page:

- [public-search.html](public-search.html)
- Filters: race text match, required classes, required feats (comma-separated).

Important: run [schema.sql](schema.sql) again so `is_public` and the updated RLS policy are applied.