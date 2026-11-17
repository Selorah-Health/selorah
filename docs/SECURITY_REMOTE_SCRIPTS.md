# Remote script audit

This audit looked for code that downloads and executes a remote script in the
production React, Vite, Tailwind, and HTML entry points.

## Findings

| Location | Finding | Decision |
| --- | --- | --- |
| `frontend/index.html` | Google Translate loader and `googleTranslateElementInit` loaded `https://translate.google.com/translate_a/element.js` on every page. | Removed. The app no longer depends on a remote translation script. |
| `frontend/src/contexts/LanguageContext.tsx` | Polled for Google Translate's `.goog-te-combo` element and changed it from the app. | Removed. The context still stores the language preference locally. |
| `frontend/src/main.tsx` | Commented Google Translate injection code. | Removed the dead code. |
| `frontend/src/index.css` | CSS that hid Google Translate banners and widgets. | Removed. |
| `frontend/vite.config.ts` | No remote script injection. | Clean. |
| `frontend/postcss.config.mjs` | No remote script injection. | Clean. |
| `frontend/package.json` | No install-time script downloads a remote payload. | Clean. |
| `frontend/vercel.json` | No remote script injection. | Clean. |

## Intentional third-party scripts

These are expected product dependencies, not injected code:

- Paystack inline checkout loads `https://js.paystack.co/v1/inline.js` only when
  the patient starts a card payment.
- Tesseract OCR uses the local asset first and falls back to the official CDN if
  the local asset is unavailable.

Both are documented so a future audit does not remove a payment or OCR path by
mistake.

## Environment note

`env.txt` is gitignored and contains a `PAYSTACK_SECRET_KEY`. The unused
`DANGEROUSLY_DEPLOY_VULNERABLE_TANSTACK_START_XSS` variable was removed from the
local file and from the Vercel production and preview environments. The app never
read it. Never commit `env.txt` or `.env.local`.

## Re-run the audit

```bash
grep -RIn --exclude-dir=node_modules --exclude-dir=dist -E "createElement\\(['\"]script|appendChild\\(.*script|import\\(|src=[\"']https?://" frontend/src frontend/index.html frontend/vite.config.ts frontend/postcss.config.mjs
```
