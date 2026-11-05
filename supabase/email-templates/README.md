# Selorah email templates

These files are designed for Supabase Auth emails and the `send-email` Edge
Function. They use the same brand, colours, and layout as the app: a dark navy
outer area, a white card, a dark banner, a blue call to action, and a dark
footer with social links.

## Supabase Auth templates

The five HTML files are generated from `generate.mjs`. Edit the shared shell or
the template copy in that script, then run:

```sh
node supabase/email-templates/generate.mjs
```

Paste each generated file into the matching screen in Supabase Dashboard >
Authentication > Emails. Keep the Go template variables exactly as written.

| Supabase template | File |
| --- | --- |
| Confirm signup | `confirmation.html` |
| Reset password | `recovery.html` |
| Magic link | `magic-link.html` |
| Invite user | `invite.html` |
| Change email address | `email-change.html` |

The confirmation and recovery buttons use `{{ .ConfirmationURL }}`. Do not
replace that with a hard-coded URL. Supabase fills it with the one-time link.

Set the Auth Site URL to `https://www.selorah.app` and add these redirect URLs:

- `https://www.selorah.app/auth/callback`
- `https://selorah.app/auth/callback`
- `http://localhost:5199/auth/callback`

The app callback reads the session, sends new patients to `/onboarding`, and
sends existing patients and staff to their portal.

## Product emails

The `send-email` Edge Function renders these templates:

- `welcome`
- `new_survey`
- `upgrade`
- `payment_receipt`
- `withdrawal_paid`
- `security_alert`

The layout includes the Selorah logo, an eyebrow label, a detail table, a clear
call to action, and a footer with Privacy, Terms, and Contact links. Product
emails are queued in `public.email_queue` and delivered by Resend.

See `docs/RESEND_SETUP.md` for the full setup, including DNS, SMTP, secrets, and
the scheduled queue worker.
