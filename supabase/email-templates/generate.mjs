import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const BRAND = {
  name: 'Selorah Health',
  site: 'https://www.selorah.app',
  support: 'support@selorah.app',
  logo: 'https://www.selorah.app/logo.png',
  navy: '#06123A',
  blue: '#6183FF',
  blueHover: '#4D6ED6',
  ink: '#101217',
  muted: '#5B6475',
  soft: '#F5F7FF',
  line: '#E6EAFF',
};

const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/selorahealth',
    icon: 'https://www.selorah.app/landing/social-instagram.png',
  },
  {
    name: 'X',
    href: 'https://x.com/selorahealth',
    icon: 'https://www.selorah.app/landing/social-x.png',
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/selorahealth',
    icon: 'https://www.selorah.app/landing/social-linkedin.png',
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/@selorahealth',
    icon: 'https://www.selorah.app/landing/social-tiktok.png',
  },
  {
    name: 'WhatsApp',
    href: 'https://chat.whatsapp.com/JI2LK41IF8yHiJjEuWKk2M?mode=gi_t',
    icon: 'https://www.selorah.app/landing/social-whatsapp.png',
  },
];

const socialRow = SOCIALS.map(
  (social) => `
                    <td style="padding:0 5px;">
                      <a href="${social.href}" style="text-decoration:none;">
                        <img src="${social.icon}" width="20" height="20" alt="${social.name}" style="display:block;border:0;opacity:0.9;">
                      </a>
                    </td>`,
).join('');

function paragraphs(items) {
  return items
    .map(
      (item) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${BRAND.ink};">${item}</p>`,
    )
    .join('\n            ');
}

function shell({
  title,
  preheader,
  bannerHeading,
  bannerBody,
  greeting,
  body,
  buttonLabel,
  note,
  footerLine,
  footerSubline,
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <title>${title}</title>
    <style>
      @media only screen and (max-width: 620px) {
        .email-outer { padding: 0 !important; }
        .email-card { width: 100% !important; border-radius: 0 !important; }
        .banner-cell { padding: 26px 24px 28px !important; }
        .banner-icon-cell { display: none !important; }
        .body-cell { padding: 28px 24px 8px !important; }
        .footer-cell { padding: 26px 24px 30px !important; }
        .banner-heading { font-size: 26px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.navy};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none;font-size:1px;color:${BRAND.navy};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.navy};padding:36px 14px;" class="email-outer">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:8px;overflow:hidden;" class="email-card">
            <tr>
              <td style="background:${BRAND.navy};padding:0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:28px 30px 30px;" class="banner-cell" valign="top">
                      <a href="{{ .SiteURL }}" style="text-decoration:none;">
                        <img src="${BRAND.logo}" width="42" height="42" alt="${BRAND.name}" style="display:block;border:0;border-radius:11px;">
                      </a>
                      <p style="margin:22px 0 0;font-size:10px;line-height:1.4;letter-spacing:0.2em;text-transform:uppercase;color:#8FA8FF;font-weight:800;">${BRAND.name}</p>
                      <h1 class="banner-heading" style="margin:10px 0 0;font-size:30px;line-height:1.16;color:#FFFFFF;font-weight:800;letter-spacing:-0.02em;">${bannerHeading}</h1>
                      <p style="margin:12px 0 0;max-width:390px;font-size:13px;line-height:1.65;color:rgba(255,255,255,0.62);">${bannerBody}</p>
                    </td>
                    <td width="118" align="center" valign="middle" style="padding:0 24px 0 0;" class="banner-icon-cell">
                      <div style="width:74px;height:74px;border-radius:22px;background:${BRAND.blue};color:#FFFFFF;font-size:38px;line-height:74px;text-align:center;font-weight:300;box-shadow:0 18px 40px rgba(97,131,255,0.35);">+</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 36px 8px;" class="body-cell">
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:${BRAND.ink};font-weight:700;">${greeting}</p>
                ${paragraphs(body)}
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 0;">
                  <tr>
                    <td align="center" style="border-radius:10px;background:${BRAND.blue};">
                      <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:15px 28px;font-size:14px;line-height:1.2;font-weight:800;color:#FFFFFF;text-decoration:none;border-radius:10px;">${buttonLabel}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:${BRAND.muted};">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:6px 0 0;font-size:12px;line-height:1.6;color:${BRAND.blue};word-break:break-all;">{{ .ConfirmationURL }}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 26px;">
                  <tr>
                    <td style="padding:16px 18px;background:${BRAND.soft};border:1px solid ${BRAND.line};border-radius:10px;">
                      <p style="margin:0;font-size:12px;line-height:1.65;color:${BRAND.muted};">${note}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:${BRAND.navy};padding:28px 36px 30px;" class="footer-cell">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#FFFFFF;font-weight:800;">${footerLine}</p>
                <p style="margin:6px 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.55);">${footerSubline}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 0;">
                  <tr>${socialRow}
                  </tr>
                </table>
                <p style="margin:20px 0 0;font-size:11px;line-height:1.6;color:rgba(255,255,255,0.38);">${BRAND.name} Limited, Lagos, Nigeria. Questions? <a href="mailto:${BRAND.support}" style="color:rgba(255,255,255,0.7);text-decoration:underline;">${BRAND.support}</a></p>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;max-width:600px;text-align:center;font-size:10px;line-height:1.6;color:rgba(255,255,255,0.38);">You received this email because this address was used on Selorah. If this was not you, you can ignore this message.</p>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

const templates = [
  {
    file: 'confirmation.html',
    title: 'Confirm your Selorah email',
    preheader: 'Confirm your email to finish creating your Selorah account.',
    bannerHeading: 'Your health record should travel with you.',
    bannerBody:
      'One encrypted home for your results, prescriptions, and visit history. Confirm your email to finish setting up your account.',
    greeting: 'Hi there,',
    body: [
      'Welcome to Selorah. You are one step away from a private health record that you control.',
      'Confirm your email address so we know this account belongs to you. The link is single use and expires soon.',
    ],
    buttonLabel: 'Confirm email',
    note: 'If you did not create a Selorah account, ignore this email. No account will be activated without this confirmation.',
    footerLine: 'Stay in control. Stay informed.',
    footerSubline: 'Team Selorah',
  },
  {
    file: 'recovery.html',
    title: 'Reset your Selorah password',
    preheader: 'Use this secure link to reset your Selorah password.',
    bannerHeading: 'Let us get you back in.',
    bannerBody:
      'A password reset was requested for your Selorah account. Use the button below to choose a new password.',
    greeting: 'Hi there,',
    body: [
      'We received a request to reset the password for your Selorah account.',
      'Choose a new password using the secure link below. If you did not ask for this, you can ignore this email and your password will stay the same.',
    ],
    buttonLabel: 'Reset password',
    note: 'This link is single use and expires soon. For your safety, never share this link with anyone.',
    footerLine: 'Stay in control. Stay informed.',
    footerSubline: 'Team Selorah',
  },
  {
    file: 'magic-link.html',
    title: 'Your Selorah sign-in link',
    preheader: 'Use this secure link to sign in to Selorah.',
    bannerHeading: 'A secure link, just for you.',
    bannerBody:
      'Skip the password and sign in with a single link. It works once and expires quickly.',
    greeting: 'Hi there,',
    body: [
      'Use the button below to sign in to your Selorah account.',
      'This link is single use. If you did not request it, you can ignore this email.',
    ],
    buttonLabel: 'Sign in to Selorah',
    note: 'For your safety, never forward this email or share the sign-in link with anyone.',
    footerLine: 'Stay in control. Stay informed.',
    footerSubline: 'Team Selorah',
  },
  {
    file: 'invite.html',
    title: 'You have been invited to Selorah',
    preheader: 'Accept your invitation to join Selorah.',
    bannerHeading: 'Your records, finally in one place.',
    bannerBody:
      'You have been invited to join Selorah. Accept the invitation to create your account and take control of your health record.',
    greeting: 'Hello,',
    body: [
      'You have been invited to join Selorah, a patient owned health record.',
      'Accept the invitation below to create your account. If you were not expecting this invitation, you can ignore this email.',
    ],
    buttonLabel: 'Accept invitation',
    note: 'This invitation is tied to this email address. It should only be used by the person it was sent to.',
    footerLine: 'Stay in control. Stay informed.',
    footerSubline: 'Team Selorah',
  },
  {
    file: 'email-change.html',
    title: 'Confirm your new Selorah email',
    preheader: 'Confirm this address to finish changing your Selorah email.',
    bannerHeading: 'Confirm your new email.',
    bannerBody:
      'We need to confirm this address before it becomes the email on your Selorah account.',
    greeting: 'Hi there,',
    body: [
      'A request was made to change the email address on your Selorah account to this address.',
      'Confirm the change below. Until you do, your current email will stay active.',
    ],
    buttonLabel: 'Confirm new email',
    note: 'If you did not request this change, ignore this email and review your account security.',
    footerLine: 'Stay in control. Stay informed.',
    footerSubline: 'Team Selorah',
  },
];

for (const template of templates) {
  const html = shell(template);
  writeFileSync(join(here, template.file), html, 'utf8');
  console.log(`wrote ${template.file}`);
}
