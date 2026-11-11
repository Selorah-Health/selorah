import { useEffect, useState } from 'react';
import { confirmDialog } from './dialogs';

/**
 * Browser permissions are an implicit state machine: prompt, granted, or
 * denied. The browser owns the transitions, so the app can only observe them.
 * Keeping the states explicit here makes it clear what the UI can and cannot
 * do, especially inside an installed PWA.
 */
export type PermissionKind = 'microphone' | 'camera' | 'geolocation' | 'notifications';
export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

type Platform = 'ios' | 'android' | 'desktop';

const LABELS: Record<PermissionKind, string> = {
  microphone: 'Microphone',
  camera: 'Camera',
  geolocation: 'Location',
  notifications: 'Notifications',
};

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop';

  const userAgent = navigator.userAgent;
  const isIpad =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  if (/iPad|iPhone|iPod/i.test(userAgent) || isIpad) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'desktop';
}

export function isStandalonePwa() {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export async function getPermissionState(
  kind: PermissionKind,
): Promise<PermissionState> {
  if (typeof window === 'undefined') return 'unsupported';

  if (kind === 'notifications') {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission === 'default' ? 'prompt' : Notification.permission;
  }

  if (!navigator.permissions?.query) return 'unsupported';

  try {
    const status = await navigator.permissions.query({
      name: kind as PermissionName,
    });
    return status.state;
  } catch {
    // Safari and Firefox do not expose every permission through the Permissions
    // API. The caller can still try the real request and handle the error.
    return 'unsupported';
  }
}

/**
 * Observe a permission without prompting. The value is refreshed when the app
 * becomes visible again, which is what happens after a patient changes a
 * setting and returns to the installed PWA.
 */
export function usePermissionState(kind: PermissionKind): PermissionState {
  const [state, setState] = useState<PermissionState>('prompt');

  useEffect(() => {
    let active = true;
    let status: PermissionStatus | null = null;

    const update = async () => {
      const next = await getPermissionState(kind);
      if (active) setState(next);
    };

    void update();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void update();
    };
    document.addEventListener('visibilitychange', onVisible);

    if (kind !== 'notifications' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: kind as PermissionName })
        .then((result) => {
          status = result;
          if (active) setState(result.state);
          result.onchange = () => {
            if (active) setState(result.state);
          };
        })
        .catch(() => undefined);
    }

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
      if (status) status.onchange = null;
    };
  }, [kind]);

  return state;
}

export function isPermissionDeniedError(error: unknown) {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return (
      error.name === 'NotAllowedError' ||
      error.name === 'PermissionDeniedError' ||
      error.name === 'SecurityError'
    );
  }

  if (typeof error === 'object' && error !== null) {
    const maybe = error as { name?: string; code?: number };
    return (
      maybe.name === 'NotAllowedError' ||
      maybe.name === 'PermissionDeniedError' ||
      maybe.code === 1
    );
  }

  return false;
}

/**
 * Browsers intentionally do not let a site reopen the permission prompt after
 * the patient blocks it. The honest fix is to explain exactly where the
 * setting lives, then let them retry the action from the same screen.
 */
export function permissionHelp(kind: PermissionKind) {
  const platform = detectPlatform();
  const label = LABELS[kind].toLowerCase();

  const steps: Record<PermissionKind, Record<Platform, string>> = {
    microphone: {
      ios: 'Open Settings > Apps > Selorah > Microphone and turn it on. If Selorah is not listed, open Settings > Privacy & Security > Microphone and allow Safari or Selorah. Reopen Selorah, then try again.',
      android:
        'Long-press the Selorah icon, open App info > Permissions > Microphone, and choose Allow. In a browser, open the lock icon next to the address and allow Microphone. Return to Selorah, then try again.',
      desktop:
        'Open the lock or tune icon next to the address, set Microphone to Allow, and reload the page. Then try again.',
    },
    camera: {
      ios: 'Open Settings > Apps > Selorah > Camera and turn it on. If Selorah is not listed, open Settings > Privacy & Security > Camera and allow Safari or Selorah. Reopen Selorah, then try again.',
      android:
        'Long-press the Selorah icon, open App info > Permissions > Camera, and choose Allow. In a browser, open the lock icon next to the address and allow Camera. Return to Selorah, then try again.',
      desktop:
        'Open the lock or tune icon next to the address, set Camera to Allow, and reload the page. Then try again.',
    },
    geolocation: {
      ios: 'Open Settings > Privacy & Security > Location Services > Selorah and choose While Using the App. If Selorah is not listed, allow Safari Websites there, or open Settings > Apps > Selorah > Location. Reopen Selorah, then try again.',
      android:
        'Long-press the Selorah icon, open App info > Permissions > Location, and choose Allow. In a browser, open the lock icon next to the address and allow Location. Return to Selorah, then try again.',
      desktop:
        'Open the lock or tune icon next to the address, set Location to Allow, and reload the page. Then try again.',
    },
    notifications: {
      ios: 'Open Settings > Notifications > Selorah and allow notifications. Web notifications on iPhone and iPad need iOS 16.4 or newer and Selorah added to the Home Screen. Reopen Selorah, then try again.',
      android:
        'Long-press the Selorah icon, open App info > Notifications, and allow notifications. In a browser, open the lock icon next to the address and allow Notifications. Return to Selorah, then try again.',
      desktop:
        'Open the lock or tune icon next to the address, set Notifications to Allow, and reload the page. Then try again.',
    },
  };

  const intro = isStandalonePwa()
    ? `Selorah is installed on this device and ${label} is blocked. The browser will not show the permission prompt again until you change this setting.`
    : `Your browser is blocking ${label}. It will not show the permission prompt again until you change this setting.`;

  return [intro, steps[kind][platform]].join('\n\n');
}

/**
 * Shows the shared confirmation dialog with platform specific instructions.
 * The return value is true when the patient wants to retry immediately.
 *
 * Inline "How to enable" hints pass a calm label because they do not retry the
 * action themselves. Error paths keep the retry label because they do.
 */
export async function showPermissionHelp(
  kind: PermissionKind,
  options?: { confirmLabel?: string; cancelLabel?: string },
) {
  const fallbackCancelLabel =
    kind === 'microphone'
      ? 'Upload audio instead'
      : kind === 'geolocation'
        ? 'Enter manually'
        : kind === 'camera'
          ? 'Choose a file'
          : 'Close';

  return confirmDialog({
    title: `${LABELS[kind]} access is blocked`,
    message: permissionHelp(kind),
    confirmLabel:
      options?.confirmLabel ?? (kind === 'notifications' ? 'I understand' : 'Try again'),
    cancelLabel: options?.cancelLabel ?? fallbackCancelLabel,
    icon: 'info',
  });
}
