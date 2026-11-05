# Selorah launch setup

This is the short, ordered version of the setup work that is still open. Use it
with `docs/GOOGLE_AUTH_SETUP.md` and `docs/RESEND_SETUP.md`.

Project values:

- Supabase project ref: `dbpyyhrbekamyejizson`
- Public site: `https://www.selorah.app`
- Support inbox: `support@selorah.app`
- Google OAuth redirect URI:
  `https://dbpyyhrbekamyejizson.supabase.co/auth/v1/callback`

## 1. Fix Google sign in first

The error `The OAuth client was not found` or `Error 401: invalid_client` means
Supabase is sending a Google Client ID that does not exist in the selected
Google Cloud project. The provider being enabled in Supabase is not enough.

1. Open Google Cloud Console > APIs and Services > Credentials.
2. Confirm there is an OAuth 2.0 Client ID of type **Web application**.
3. If the client was deleted, create a new one. A new project means a new
   Client ID. The old ID cannot be reused.
4. Copy the exact **Client ID**. It ends with
   `.apps.googleusercontent.com`. Do not copy the project ID or project number.
5. Copy the **Client secret**.
6. Open Supabase Dashboard > Authentication > Providers > Google.
7. Replace both the Client ID and Client secret, then save.
8. In the Google client, add this exact Authorized redirect URI:
   `https://dbpyyhrbekamyejizson.supabase.co/auth/v1/callback`
9. Add these Authorized JavaScript origins:
   - `https://www.selorah.app`
   - `https://selorah.app`
   - `http://localhost:5199`
10. Wait two minutes, open an incognito window, and try Google sign in again.

If the error changes to `redirect_uri_mismatch`, the redirect URI in Google is
still wrong. If the error changes to `Access blocked`, the consent screen is in
testing and the Google account is not a test user.

## 2. Deploy the legal pages, then retry branding

The legal pages are now prerendered at build time. They must be deployed before
Google branding review will pass.

1. Deploy the current `frontend` build to Vercel.
2. Confirm the Vercel project root is `frontend`.
3. Run these checks from a terminal:

```bash
curl -sS https://www.selorah.app/privacy | grep -o "Privacy Policy" | head -1
curl -sS https://www.selorah.app/privacy | grep -o "Data We Collect" | head -1
curl -sS https://www.selorah.app/robots.txt
curl -sS https://www.selorah.app/sitemap.xml
```

The first two commands must print a match. The last two must print the real
files, not the React app shell.

4. Open Google Search Console and add a **Domain** property for `selorah.app`.
5. Add the DNS TXT record Google gives you at Name.com. Use host `@`, type
   `TXT`, and the exact value Google shows. TTL can be 300.
6. Click verify in Search Console.
7. Wait 24 hours. This delay is required before a branding re-review.
8. Open Google Auth Platform > Branding. Click **I have fixed the issues** and
   request another review.

## 3. Fix account ownership

`support@selorah.app` currently forwards to `selorahealth@gmail.com`. That is
fine for a support inbox, but it is not a separate owner identity.

Do this now:

1. Turn on 2-step verification on the Google account that owns the Cloud
   project.
2. Add a second Google account as an **Owner** on the Google Cloud project.
3. Add the same second account as an **Owner** in Search Console.
4. Store the recovery codes in a password manager.
5. Remove any personal email from the public developer contact fields. Use
   `support@selorah.app` and the second owner address.

Google Workspace is not required today. A second Google account is enough to
remove the single-owner risk. When the company is registered, create Google
Workspace or Cloud Identity Free and move the Cloud project under the company
organization. Then create `admin@selorah.app` and make it the long-term owner.

## 4. Verify Resend on Name.com

1. Open the Resend dashboard > Domains.
2. Add `selorah.app`. Do not add `www.selorah.app`.
3. Resend shows several DNS records. Keep that screen open.
4. In Name.com, open the domain > DNS Records > Add Record.
5. Add every record exactly as Resend shows it:
   - MX record for the sending subdomain
   - TXT record for SPF
   - TXT record for DKIM
   - TXT record for DMARC, if Resend provides one
6. Use host `@` for the root domain. For a subdomain record, use only the
   subdomain prefix, not the full domain.
7. Set TTL to 300 while verifying.
8. If an SPF TXT record already exists, merge the Resend include into that
   record. Never create two SPF records on the same host.
9. Wait for Resend to show **Verified**. This usually takes 15 minutes and can
   take up to 72 hours.

Then:

1. Create a Resend API key with sending access for `selorah.app`.
2. Set Supabase Edge Function secrets:
   - `RESEND_API_KEY`
   - `EMAIL_FROM=Selorah Health <hello@selorah.app>`
   - `EMAIL_REPLY_TO=support@selorah.app`
   - `EMAIL_CRON_SECRET` (random 32 byte hex string)
3. Deploy the product email function:
   `supabase functions deploy send-email --no-verify-jwt`
4. Configure Supabase Auth SMTP:
   - Host `smtp.resend.com`
   - Port `465` with SSL, or `587` with TLS
   - Username `resend`
   - Password: the Resend API key
   - Sender `no-reply@selorah.app`
   - Sender name `Selorah Health`
5. Paste the templates from `supabase/email-templates` into Authentication >
   Emails.
6. Send a test signup and a test password reset.

## 5. Use Dojah sandbox now

Dojah live usage is paid. It is pay-as-you-go from a prepaid wallet. Sandbox
calls are free and never charge the wallet.

1. Create a Dojah account and open the sandbox app.
2. Copy the sandbox App ID and secret key.
3. Set Supabase Edge Function secrets:
   - `DOJAH_APP_ID`
   - `DOJAH_API_KEY`
   - `DOJAH_BASE_URL=https://sandbox.dojah.io`
4. Deploy the function:
   `supabase functions deploy verify-nin`
5. Test with the sandbox NIN `70123456789`.
6. Confirm that onboarding fills the name and date of birth from the response.

Do not switch to live keys until the company registration and Dojah compliance
review are complete and the wallet is funded. Watch for a `402` response, which
means the live wallet balance is too low.

## 6. Set up Base

Use Base Sepolia for testing and Base mainnet only when the registry is ready.

1. Create a dedicated wallet for the registry. Do not use a personal wallet.
2. Get free Base Sepolia ETH from the Coinbase Developer Platform faucet.
3. Write a minimal registry contract. It should store only:
   - a record hash
   - a patient identifier hash
   - a consent proof hash
   - a record identifier
   - a timestamp
   - a version
4. Never put names, NIN, phone numbers, diagnoses, files, or images on chain.
5. Deploy to Base Sepolia with Foundry or Hardhat.
6. Add a small outbox table in Supabase so failed anchors can be retried.
7. Keep the signing key in a server side secret. Never put it in frontend code.
8. Test the full flow: create record, anchor hash, read proof, revoke consent.
9. Deploy the same contract to Base mainnet when the test flow is stable.
10. Fund the mainnet wallet with a small amount of ETH. Base transactions
    usually cost less than one cent.

## 7. Grant and funding roadmap

Base Ecosystem Fund and Base Batches are investment programs, not non-dilutive
grants. Do not use them to pay this month's subscriptions.

1. Ship the Base Sepolia registry and a public demo.
2. Publish a short technical note explaining what is anchored and what stays
   off chain.
3. Get three to five design partners using the consent and audit trail.
4. Apply to the Base Ecosystem Fund with real numbers: records anchored,
   consents granted, active patients, clinics, and retention.
5. Apply to Base Batches when the next applications open. Batch 004 is closed.
6. In parallel, apply to non-dilutive programs such as the Ethereum Foundation
   Ecosystem Support Program, Optimism Retro Funding if eligible, and health
   innovation grants in Nigeria.
7. Do not pay a grant consultant. Use the public application forms.

## 8. Subscription budget

Start with free tiers and sandbox accounts. Do not upgrade until usage requires
it.

| Service | Now | Paid tier | When to pay |
| --- | --- | --- | --- |
| Vercel | Hobby, $0 | Pro, $20/month | When you need team seats or higher limits |
| Supabase | Free, $0 | Pro, $25/month | Before public launch, to avoid project pausing |
| Resend | Free, $0, 3,000 emails/month | Pro, $20/month, 50,000 emails | When you exceed 3,000 emails or 100 per day |
| Dojah | Sandbox, $0 | Pay per successful live call | After company compliance and wallet funding |
| Google Cloud | OAuth, $0 | Workspace or Cloud Identity later | When the company is registered |
| Base | Sepolia, $0 | Mainnet gas, usually under $0.01 per transaction | At mainnet launch |
| Name.com | Domain renewal | Yearly renewal | Keep auto renew on |

Practical monthly target:

- Private beta: about $25 per month for Supabase Pro. Everything else stays on
  free or sandbox tiers.
- Public launch: about $65 per month for Supabase Pro, Vercel Pro, and Resend
  Pro, before Dojah live usage and payment fees.
- Do not pay for Vercel Pro, Resend Pro, or Dojah live until the free or sandbox
  tier is the actual blocker.

## 9. Apply the new migrations

Run these files in the Supabase SQL editor after the current schema is healthy:

- `supabase/migrations/20261105120000_period_tracker.sql`
- `supabase/migrations/20261105120100_emergency_reports.sql`

The emergency migration also creates the private `emergency-attachments` storage
bucket and its row level security policies. The app still saves a local copy on
the device if a migration has not been applied yet, but syncing and attachments
need the remote schema.

## 10. Order of operations

1. Fix the Google Client ID and secret in Supabase.
2. Deploy the legal pages and check them with `curl`.
3. Add the Search Console domain property and wait 24 hours.
4. Add the second Google owner.
5. Verify Resend on Name.com and deploy `send-email`.
6. Test Dojah sandbox with NIN `70123456789`.
7. Apply the period tracker and emergency report migrations.
8. Deploy the Base Sepolia registry.
9. Apply to the Base Ecosystem Fund only after the demo and metrics exist.
