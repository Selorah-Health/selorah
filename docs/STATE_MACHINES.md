# Implicit state machines

This document inventories the stateful flows in the Selorah web app and records
the decision for each one. The goal is to improve UX, DX, and AX without
rewriting working screens or adding a heavy dependency.

## Decision

Do not adopt XState or another state machine library. The app is small, already
uses React state, and most screens only need two or three booleans. A library
would add a new mental model without removing enough code to pay for itself.

Use three lightweight patterns instead:

1. **Discriminated unions for async work.** `frontend/src/lib/asyncState.ts`
   defines `AsyncState<T>` with exactly four states: `idle`, `loading`,
   `success`, and `error`. `useAsyncAction` runs the work and returns a typed
   result, so a screen can never show a spinner and an error at the same time.
2. **Observed browser permissions.** `frontend/src/lib/permissions.ts` models
   `prompt`, `granted`, `denied`, and `unsupported`. The browser owns the
   transitions. The app observes them and shows the correct recovery path.
3. **Observable UI state.** High-risk containers expose `data-state` and
   `data-permission` attributes. Tests and agents can see the current state
   without reading component internals.

Keep plain booleans for simple UI toggles such as a menu being open. Not every
boolean is a state machine.

## Inventory

| Flow | Main files | Implicit state today | Risk | Decision |
| --- | --- | --- | --- | --- |
| PWA update | `public/service-worker.js`, `src/lib/pwa/register.ts` | checking, installing, waiting, activating, reloading | High: a visible prompt or a stale bundle breaks trust | Silent update. `skipWaiting` on install, `clients.claim` on activate, old cache cleanup, one reload on `controllerchange`. No prompt component. |
| Offline sync | `src/contexts/SyncContext.tsx`, `src/components/NetworkStatus.tsx` | online, offline, syncing, pending | High: sync messages feel like errors during an emergency | Sync is silent. The only UI is a quiet offline indicator. No "Syncing changes" toast or banner. |
| Emergency report | `src/pages/Emergency.tsx` | loading, locating, hospital lookup, manual entry, recording, submitting, saved | High: location loss during a reload or permission block | Draft persistence, explicit permission recovery, `useAsyncAction` for hospital lookup, `data-state` attributes. |
| Browser permissions | `src/lib/permissions.ts` | prompt, granted, denied, unsupported | High: a blocked microphone or location silently disables a safety feature | Observe the state, try the real request first, and show platform specific settings steps when blocked. |
| Auth and session | `src/components/RoleGuard.tsx`, `src/lib/auth/session.ts`, `src/pages/Login.tsx`, `src/pages/Signup.tsx`, `src/pages/AuthCallback.tsx` | checking, signed out, signed in, needs confirmation, role | High: wrong redirects or a blank screen | Leave as-is. The guards already centralize the important transitions. Revisit if a bug appears. |
| Onboarding | `src/pages/Onboarding.tsx` | step, saving, role locked, NIN verification | Medium: a partial profile blocks the dashboard | Leave as-is. NIN verification is already an explicit union (`idle`, `loading`, `verified`, `error`). |
| Install prompt | `src/components/InstallPrompt.tsx` | install, iOS instructions, hidden, installing | Low: dismissal is remembered | Leave as-is. `PromptMode` is already explicit. |
| Add record | `src/components/dashboard/AddRecordModal.tsx` | profile or file mode, OCR state, camera state, saving | Medium: a blocked camera looks like a broken button | Camera permission recovery added. OCR is already an explicit union. Leave the rest. |
| Notifications | `src/pages/Notifications.tsx`, `src/lib/push.ts` | push status, busy, message, loading | Medium: a denied permission leaves a dead button | The denied button now opens platform specific help instead of staying disabled. |
| Billing and checkout | `src/pages/ProUpgrade.tsx`, `src/pages/Billing.tsx` | checkout status, Paystack ready, recovery, syncing | Medium: payment state is easy to misread | Leave as-is. `CheckoutStatus` is already a union. Revisit when the payment flow changes. |
| Card ordering | `src/pages/SelorahCard.tsx` | loading, generating, saving, order status | Medium: a slow generate looks frozen | Leave as-is. The buttons already show busy labels. |
| Security and 2FA | `src/pages/Security.tsx` | loading factors, enroll, enrolling, verifying, disable, disabling | Medium: a half-open dialog can confuse the patient | Leave as-is. Migrate to a union when the screen is next touched. |
| QR codes | `src/pages/QRCodes.tsx` | tab, expiry type, local only, loading, busy | Low: simple form toggles | Leave as-is. |
| Shared record | `src/pages/SharedRecord.tsx` | access mode, expired, revoked, loading, access logged | High: a wrong access state exposes or hides data | Leave as-is for now. The booleans are independent checks, not one workflow. Revisit with a dedicated audit. |
| Period tracker | `src/pages/PeriodTracker.tsx` | sync state, saving, form open | Low: local-first screen | Leave as-is. `syncState` is already a union. |
| Waitlist | `src/components/WaitlistModal.tsx` | idle, loading, success, survey | Low: marketing flow | Keep as the reference example. It already uses an explicit union. |
| Privacy prompt | `src/components/PrivacyPrompt.tsx` | ready, open, force open | Medium: consent must be correct | Leave as-is. Consent is not a visual state machine. |
| Dashboard shell | `src/pages/Dashboard.tsx` | sidebar, loading, search, add modal, pro | Low: UI toggles | Leave as-is. |
| Research | `src/components/dashboard/Research.tsx` | loading, consent, submitting, saving opt-in | Medium: consent is legal state | Leave as-is. Add a union if the flow grows. |
| Family | `src/pages/Family.tsx` | loading, saving, add member | Low | Leave as-is. |
| Access log, rewards, resilience | `src/pages/AccessLog.tsx`, `src/pages/Rewards.tsx`, `src/pages/Resilience.tsx` | loading, busy, selected item | Low | Leave as-is. |

## What changed in this pass

### Emergency report

- Hospital lookup now uses `useAsyncAction`. The old `findingHospitals` and
  `hospitalError` booleans are derived from one `AsyncState`.
- The form draft, including coordinates and nearby hospitals, is saved to
  `localStorage` for 24 hours. A silent service worker reload, a crash, or a
  backgrounded PWA no longer loses the location.
- The draft is cleared after a successful submit.
- The location and voice note sections expose `data-permission`.
- The emergency form and voice note section expose `data-state`.
- A blocked microphone or location shows the exact settings path for iOS,
  Android, and desktop. The app cannot reopen a blocked browser prompt, so it
  explains that honestly and offers a retry.

### PWA update and sync

- The visible "Updating Selorah" component was removed.
- The "Syncing changes" banner was removed. Offline is the only visible state.
- Sync toasts were removed. Sync still runs in the background.
- The service worker now uses fresh HTML fetches for navigations, so a new
  deployment is picked up even if the HTTP cache has an old shell.
- `skipWaiting` and `clients.claim` have failure fallbacks. A cache problem can
  never leave the old worker in control.

### Permissions

- `usePermissionState` observes microphone, camera, location, and notification
  permission.
- `showPermissionHelp` uses the shared confirmation dialog, never a native
  prompt.
- The dialog message renders line breaks, so the steps are readable on a phone.
- The camera button and the phone notifications section expose `data-state` and
  `data-permission`, so tests and agents can see a blocked state without
  guessing.

## Migration plan

When a screen is next changed, move its async work to `useAsyncAction` if it
has separate loading, error, and data flags. Do not rewrite a working screen
only for style. Add `data-state` to the container that owns the state so tests
and agents can observe it.

The highest value next candidates are:

1. `Security.tsx`, because a half-finished 2FA setup is risky.
2. `SharedRecord.tsx`, because access mode and expiry are security sensitive.
3. `ProUpgrade.tsx`, because payment recovery has several branches.

## AX notes

- `AsyncState<T>` gives an agent the complete set of valid states.
- `data-state` values are stable, lower-case tokens.
- Permission states are the browser's own tokens: `prompt`, `granted`, `denied`,
  and `unsupported`.
- The inventory above is the map an agent should read before changing a flow.
