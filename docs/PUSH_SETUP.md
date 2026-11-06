# Web push setup for Selorah

Selorah uses the browser Push API, VAPID keys, a `push_subscriptions` table,
and the `send-push` Supabase Edge Function. A database trigger calls the
function whenever a notification is inserted. Cycle reminders are scheduled
daily at 07:00 UTC, which is 08:00 in Lagos.

## 1. Generate VAPID keys

Run this once on your computer:

```bash
npx web-push generate-vapid-keys --json
```

Keep the private key secret. The public key is safe to put in the frontend.

## 2. Add Supabase Edge Function secrets

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY="your_public_key" \
  VAPID_PRIVATE_KEY="your_private_key" \
  VAPID_SUBJECT="mailto:support@selorah.app" \
  --project-ref dbpyyhrbekamyejizson
```

Never put the private key in Vercel, a `VITE_*` variable, the repository, or
the browser.

## 3. Add the public key to Vercel

In the Vercel project, open Settings > Environment Variables and add:

```text
VITE_VAPID_PUBLIC_KEY=your_public_key
```

Add it to Production. Add it to Preview too if you test push on preview
deployments. Redeploy the frontend after saving it.

## 4. Apply the migration and deploy the function

Run the Supabase production workflow with function deployment enabled. It
applies the notification and push migration, then deploys `send-push`.

You can also deploy manually:

```bash
supabase functions deploy send-push --no-verify-jwt --project-ref dbpyyhrbekamyejizson --yes
```

The migration creates `push_dispatch_config` with a random webhook secret.
The notification trigger reads that secret and calls `send-push`. The secret
is never exposed to the browser.

## 5. Test on a phone

1. Open `https://www.selorah.app` on the phone.
2. Sign in and open Notifications.
3. Tap Enable notifications and allow the browser permission.
4. A test notification is queued. It should arrive within a few seconds.

On iPhone, push works only after the site is added to the Home Screen and
opened as an installed web app. Android Chrome works in the browser and when
installed.

## 6. What sends notifications

- New sign in and password changes
- QR code and shared record access
- New medical records and emergency reports
- Health points and task reminders
- Survey and research updates
- Period reminders for patients with cycle data
- Pro and billing changes

In-app notifications are always written even if push keys are missing. Once
the VAPID keys are set, the same events start arriving as phone notifications.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Button says phone notifications are being set up | Add `VITE_VAPID_PUBLIC_KEY` in Vercel and redeploy |
| Permission is blocked | Open browser settings for Selorah and allow notifications |
| Test notification is created but no push arrives | Check the three VAPID secrets and the `send-push` deployment |
| iPhone receives nothing | Add Selorah to the Home Screen, open it there, and allow notifications |
| Push stops after a browser update | Open the Notifications page once so the subscription is saved again |
