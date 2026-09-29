# StarPlusAI local testing

This repository now includes a dependency-free local web server.

## Start it

Requirements:

- Node.js 20+
- Internet access from the browser for Supabase, Cloudflare Turnstile, and CDN assets

Run:

```bash
npm run dev
```

Then open:

http://127.0.0.1:4173/

Useful pages:

- http://127.0.0.1:4173/
- http://127.0.0.1:4173/auth.html?mode=signup
- http://127.0.0.1:4173/auth.html?mode=login
- http://127.0.0.1:4173/app.html
- http://127.0.0.1:4173/review.html?token=...
- http://127.0.0.1:4173/__health

## Important: Supabase redirect configuration

Local hosting still uses the real Supabase project. This means authentication is real, not mocked.

In Supabase Authentication URL Configuration, add:

http://127.0.0.1:4173/app.html

and, if you also test with localhost:

http://localhost:4173/app.html

The auth pages now build their verification/reset redirect from `window.location.origin`, so the same code works locally and on production.

## What this local setup tests

It lets you test the real frontend against the real backend:

- signup
- Turnstile
- login
- email verification
- password reset
- customer management
- review requests
- review links
- review submission
- moderation
- dashboard metrics
- widget/API calls
- mobile layouts
- loading/error/empty states

It does NOT create a fake local Supabase database or fake email provider. Supabase Auth/database/Edge Functions remain the real services.

## Production safety

Do not put service-role keys, Resend secrets, OAuth secrets, or Turnstile secret keys into this repository or browser code.

Only the existing publishable Supabase client configuration belongs in browser code.

## Recommended test order

1. Start the local server.
2. Open `auth.html?mode=signup`.
3. Create a dedicated test account.
4. Complete Turnstile.
5. Verify the email.
6. Log in.
7. Add a customer.
8. Create a review request.
9. Open the generated review link.
10. Submit a review.
11. Approve/reject it in the dashboard.
12. Test the public widget.
13. Repeat at 320px, 375px, 390px, 430px and desktop widths.

Because Netlify production deploys are currently paused by account credit usage, this local server is the safe way to continue functional QA without waiting for Netlify.
