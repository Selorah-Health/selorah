import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  KeyIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';
import { confirmDialog } from '../lib/dialogs';
import { createSelfNotification } from '../lib/notifications';

type TotpFactor = {
  id: string;
  friendly_name?: string | null;
  factor_type: string;
  status: string;
};

export default function Security() {
  const navigate = useNavigate();
  const supabase = createClient();
  const { success: toastSuccess, error: toastError, info } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);

  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState<string | null>(null);
  const [disabling, setDisabling] = useState(false);
  const [signingOutOthers, setSigningOutOthers] = useState(false);

  const loadFactors = useCallback(async () => {
    setLoadingFactors(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const totp = (data?.totp || []).filter(
        (factor: TotpFactor) => factor.status === 'verified'
      );
      setFactors(totp);
    } catch {
      setFactors([]);
    } finally {
      setLoadingFactors(false);
    }
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFactors();
  }, [loadFactors]);

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ tone: 'error', text: 'Use at least 8 characters for the new password.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ tone: 'error', text: 'The new passwords do not match.' });
      return;
    }

    setChangingPassword(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setPasswordMessage({
          tone: 'error',
          text: 'This account has no email address, so the password cannot be changed here.',
        });
        return;
      }

      // Verify the current password before changing it.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        setPasswordMessage({ tone: 'error', text: 'Your current password is not correct.' });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({
        tone: 'success',
        text: 'Password updated. Use the new password the next time you log in.',
      });
      toastSuccess('Your password has been updated.', 'Password changed');

      try {
        await createSelfNotification(supabase, {
          kind: 'security',
          title: 'Password changed',
          body: 'Your Selorah password was changed. If this was not you, reset it immediately.',
          href: '/dashboard/security',
          metadata: { event: 'password-changed' },
        });
      } catch {
        // The password change already succeeded.
      }
    } catch (error) {
      setPasswordMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Could not update the password.',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const startEnrollment = async () => {
    setShowEnroll(true);
    setEnrolling(true);
    setEnrollError(null);
    setCode('');
    setQrCode('');
    setSecret('');

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Selorah authenticator',
      });
      if (error) throw error;

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);

      const challenge = await supabase.auth.mfa.challenge({ factorId: data.id });
      if (challenge.error) throw challenge.error;
      setChallengeId(challenge.data.id);
    } catch (error) {
      setEnrollError(
        error instanceof Error ? error.message : 'Could not start two-factor setup.'
      );
    } finally {
      setEnrolling(false);
    }
  };

  const closeEnrollment = () => {
    setShowEnroll(false);
    setFactorId('');
    setChallengeId('');
    setCode('');
    setQrCode('');
    setSecret('');
    setEnrollError(null);
  };

  const verifyEnrollment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!factorId || !challengeId) return;

    setVerifying(true);
    setEnrollError(null);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: code.replace(/\s/g, ''),
      });
      if (error) throw error;

      toastSuccess('Two-factor authentication is now protecting your account.', '2FA enabled');
      closeEnrollment();
      await loadFactors();
    } catch (error) {
      setEnrollError(
        error instanceof Error ? error.message : 'That code did not work. Try the next code.'
      );
    } finally {
      setVerifying(false);
    }
  };

  const openDisableMfa = async () => {
    const factor = factors[0];
    if (!factor) return;

    const confirmed = await confirmDialog({
      title: 'Turn off two-factor authentication?',
      message:
        'This account will be protected by your password only. You will need your authenticator code to confirm.',
      confirmLabel: 'Continue',
      tone: 'danger',
      icon: 'shield',
    });
    if (!confirmed) return;

    setDisableCode('');
    setDisableError(null);
    setShowDisable(true);
  };

  const closeDisableMfa = () => {
    if (disabling) return;
    setShowDisable(false);
    setDisableCode('');
    setDisableError(null);
  };

  const disableMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    const factor = factors[0];
    if (!factor) {
      setShowDisable(false);
      return;
    }

    const cleanCode = disableCode.replace(/\s/g, '');
    if (cleanCode.length !== 6) {
      setDisableError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setDisabling(true);
    setDisableError(null);

    try {
      // Unenrolling a verified factor requires an AAL2 session. Challenge and
      // verify the TOTP factor first so Supabase elevates this session.
      const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (challenge.error) throw challenge.error;

      const verified = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.data.id,
        code: cleanCode,
      });
      if (verified.error) throw verified.error;

      const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (error) throw error;

      info('Two-factor authentication has been turned off.');
      setShowDisable(false);
      setDisableCode('');
      await loadFactors();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not turn off two-factor authentication.';
      const friendly = /aal2|assurance level/i.test(message)
        ? 'This session needs a fresh authenticator check. Enter the current 6-digit code and try again.'
        : message;
      setDisableError(friendly);
      toastError(friendly, 'Could not turn off 2FA');
    } finally {
      setDisabling(false);
    }
  };

  const signOutOtherDevices = async () => {
    const confirmed = await confirmDialog({
      title: 'Log out of other devices?',
      message:
        'Every other phone, tablet, or browser signed in to this account will be signed out. This device stays signed in. You can sign in again on those devices with your password.',
      confirmLabel: 'Log out other devices',
      cancelLabel: 'Keep them signed in',
      tone: 'danger',
      icon: 'shield',
    });
    if (!confirmed) return;

    setSigningOutOthers(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;

      toastSuccess('Other devices have been signed out.', 'Sessions closed');

      try {
        await createSelfNotification(supabase, {
          kind: 'security',
          title: 'Other devices signed out',
          body: 'You signed out of all other devices. If this was not you, change your password immediately.',
          href: '/dashboard/security',
          metadata: { event: 'sessions-revoked' },
        });
      } catch {
        // The sign-out already succeeded.
      }
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : 'Could not log out other devices.',
        'Could not log out other devices'
      );
    } finally {
      setSigningOutOthers(false);
    }
  };

  return (
    <div className="space-y-8 font-sora">
      <button
        onClick={() => navigate('/dashboard/profile')}
        className="flex items-center gap-2 text-gray-400 hover:text-primary transition-all group"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span className="font-bold text-sm">Back to Profile</span>
      </button>

      <div className="bg-white rounded-[40px] border border-gray-50 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="p-6 sm:p-10 border-b border-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#101217] tracking-tight">
                Security Settings
              </h2>
              <p className="text-gray-400 font-medium text-sm">
                Manage your account protection, sessions, and authentication methods.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 md:p-14 space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <KeyIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-black text-[#101217] uppercase tracking-widest">
                Change Password
              </h3>
            </div>
            <form onSubmit={handleUpdatePassword} className="max-w-md space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat the new password"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:outline-none focus:border-primary transition-all"
                />
              </div>

              {passwordMessage && (
                <p
                  className={`flex items-start gap-1.5 text-xs font-semibold leading-relaxed ${
                    passwordMessage.tone === 'success' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {passwordMessage.tone === 'success' && (
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  {passwordMessage.text}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  changingPassword || !currentPassword || !newPassword || !confirmPassword
                }
                className="flex items-center justify-center gap-2 bg-[#101217] text-white font-bold py-4 px-8 rounded-2xl hover:bg-[#2A2D35] transition-all disabled:opacity-50"
              >
                {changingPassword ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </section>

          <section className="pt-12 border-t border-gray-50">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-black text-[#101217] uppercase tracking-widest">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    {loadingFactors
                      ? 'Checking your authenticator status...'
                      : factors.length > 0
                        ? 'An authenticator app is protecting this account.'
                        : 'Add an authenticator app for an extra layer of security.'}
                  </p>
                </div>
              </div>
              {factors.length > 0 ? (
                <button
                  type="button"
                  onClick={openDisableMfa}
                  className="min-h-[44px] rounded-xl border border-red-100 bg-red-50 px-5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100"
                >
                  Turn off 2FA
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startEnrollment}
                  disabled={loadingFactors}
                  className="min-h-[44px] rounded-xl bg-primary px-5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  Set up 2FA
                </button>
              )}
            </div>
          </section>

          <section className="pt-12 border-t border-gray-50">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-black text-[#101217] uppercase tracking-widest">
                    Devices and sessions
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    Log out of every other phone, tablet, or browser signed in to this account.
                    This device stays signed in.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void signOutOtherDevices()}
                disabled={signingOutOthers}
                data-state={signingOutOthers ? 'working' : 'idle'}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold text-[#101217] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                {signingOutOthers ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <DevicePhoneMobileIcon className="h-4 w-4" />
                    Log out other devices
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>

      {showEnroll && (
        <div
          className="fixed inset-0 z-[150] flex items-end justify-center bg-[#05081A]/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mfa-title"
        >
          <div className="w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="mfa-title" className="text-lg font-bold text-[#101217]">
                  Set up two-factor authentication
                </h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-gray-400">
                  Scan the code with Google Authenticator, Authy, or any TOTP app.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEnrollment}
                disabled={verifying}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            {enrolling ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <ArrowPathIcon className="h-7 w-7 animate-spin text-primary" />
                <p className="text-xs font-semibold text-gray-400">Creating your secure key...</p>
              </div>
            ) : enrollError && !qrCode ? (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                {enrollError}
              </div>
            ) : (
              <form onSubmit={verifyEnrollment} className="mt-5 space-y-4">
                <div className="flex justify-center rounded-2xl border border-gray-100 bg-white p-4">
                  {qrCode ? (
                    <img src={qrCode} alt="Authenticator QR code" className="h-44 w-44" />
                  ) : (
                    <div className="h-44 w-44 animate-pulse rounded-xl bg-gray-50" />
                  )}
                </div>

                {secret && (
                  <div className="rounded-xl bg-[#F8F9FE] px-4 py-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">
                      Manual setup key
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] font-semibold text-[#101217]">
                      {secret}
                    </p>
                  </div>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                    6-digit code
                  </span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-center text-lg font-bold tracking-[0.3em] text-[#101217] outline-none focus:border-primary focus:bg-white"
                  />
                </label>

                {enrollError && (
                  <p className="text-xs font-semibold text-red-500">{enrollError}</p>
                )}

                <button
                  type="submit"
                  disabled={verifying || code.length !== 6}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Enable two-factor authentication'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {showDisable && (
        <div
          className="fixed inset-0 z-[150] flex items-end justify-center bg-[#05081A]/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disable-mfa-title"
        >
          <div className="w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="disable-mfa-title" className="text-lg font-bold text-[#101217]">
                  Confirm it is you
                </h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-gray-400">
                  Enter the current 6-digit code from your authenticator app. We use it to verify
                  this session before removing the factor.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDisableMfa}
                disabled={disabling}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={disableMfa} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                  6-digit code
                </span>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  value={disableCode}
                  onChange={(event) =>
                    setDisableCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="000000"
                  className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-center text-lg font-bold tracking-[0.3em] text-[#101217] outline-none focus:border-primary focus:bg-white"
                />
              </label>

              {disableError && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold leading-relaxed text-red-600">
                  {disableError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDisableMfa}
                  disabled={disabling}
                  className="min-h-[44px] rounded-xl border border-gray-200 bg-white px-4 text-xs font-bold text-gray-500 transition-colors hover:border-gray-300 hover:text-[#101217] disabled:opacity-50"
                >
                  Keep 2FA on
                </button>
                <button
                  type="submit"
                  disabled={disabling || disableCode.length !== 6}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {disabling ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Turn off 2FA'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
