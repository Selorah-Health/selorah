# Google sign in setup

The app now has a **Continue with Google** button on login and patient signup,
plus a `/auth/callback` route. This guide enables the Google provider and makes
the callback work in local development and production.

## 1. Create a Google OAuth client

1. Open the Google Cloud Console and create or select a project.
2. Go to **APIs and Services > OAuth consent screen**.
3. Choose **External** unless the app is only for a Google Workspace
   organization.
4. Fill in:
   - App name: `Selorah Health`
   - User support email: `selorahealth@gmail.com`
   - App logo: the Selorah logo
   - Application home page: `https://www.selorah.app`
   - Privacy policy: `https://www.selorah.app/privacy`
   - Terms of service: `https://www.selorah.app/terms`
   - Developer contact email: `selorahealth@gmail.com`
5. Add the scopes `openid`, `email`, and `profile`. These are basic sign in
   scopes and do not request Gmail, Drive, or any health data.
6. While the app is in testing, add the Google accounts you will use for QA as
   test users.
7. Go to **APIs and Services > Credentials > Create credentials > OAuth client
   ID**.
8. Choose **Web application**.
9. Add authorized JavaScript origins:
   - `https://www.selorah.app`
   - `https://selorah.app`
   - `http://localhost:5199`
10. Add the authorized redirect URI. This is the Supabase callback, not the app
    callback:
    - `https://dbpyyhrbekamyejizson.supabase.co/auth/v1/callback`
11. Create the client and copy the Client ID and Client Secret.

Do not add `/auth/callback` to the Google redirect URI. Google returns to
Supabase, and Supabase returns to the app at `/auth/callback`.

## 2. Enable Google in Supabase

1. Supabase Dashboard > Authentication > Providers > Google.
2. Enable the provider.
3. Paste the Google Client ID and Client Secret.
4. Save.

## 3. Set the Supabase Auth URLs

Supabase Dashboard > Authentication > URL Configuration:

- Site URL: `https://www.selorah.app`
- Redirect URLs:
  - `https://www.selorah.app/auth/callback`
  - `https://selorah.app/auth/callback`
  - `http://localhost:5199/auth/callback`

## 4. Check the app flow

The app handles these cases:

- New Google account with no patient profile: `/auth/callback` sends the person
  to `/onboarding` with their name prefilled from Google.
- Existing patient: `/auth/callback` sends the person to `/dashboard`.
- Staff account: `/auth/callback` sends the person to their portal home.
- Email and password signup: the confirmation link now returns to
  `/auth/callback`, then continues to onboarding after confirmation.
- Unconfirmed email: the callback shows a confirmation screen with a resend
  button.

The local session is written from the Supabase session, not from a stale
`selorah_user` cache. This also fixes the old role mismatch where the sidebar
could show a different account from the authenticated session.

## 5. Test locally

1. Start the app on port `5199`.
2. Open `http://localhost:5199/login`.
3. Click **Continue with Google**.
4. Choose a test Google account.
5. For a new account, confirm that onboarding opens with the first and last name
   filled in.
6. Finish onboarding and confirm that the dashboard opens.
7. Log out and use Google again. The callback should send the existing account
   straight to the dashboard.

You can also test the email signup path:

1. Create an account with email and password.
2. Open the confirmation email.
3. Confirm the address.
4. The callback should open onboarding, not the login page.

## 6. Production checklist

- The OAuth consent screen is published, or all real users are added as test
  users.
- The production redirect URLs are saved in Supabase.
- The Google redirect URI is exactly
  `https://dbpyyhrbekamyejizson.supabase.co/auth/v1/callback`.
- `https://www.selorah.app/auth/callback` is allowed in Supabase.
- The app is served over HTTPS.
- The Resend SMTP setup is complete so confirmation and recovery emails arrive.
- The privacy policy and terms links on the consent screen are live.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Unsupported provider: provider is not enabled` | Google is off in Supabase | Enable it in Authentication > Providers > Google |
| `redirect_uri_mismatch` | Google redirect URI is wrong | Use the Supabase `/auth/v1/callback` URI exactly |
| Callback loops back to login | Supabase redirect URL is missing | Add the app callback URL in Auth > URL Configuration |
| Google account signs in but onboarding does not open | The account already has a patient profile | That is expected; use a fresh Google account for a new-user test |
| Staff account lands in the patient dashboard | The `users` row has role `patient` or is missing | Set the role in `public.users` and sign in again |
| Consent screen blocks users | App is in testing and the user is not a test user | Add the user or publish the app |
