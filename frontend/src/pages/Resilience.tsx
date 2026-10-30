import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  FingerPrintIcon,
  KeyIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { fetchMedicalRecords, type MedicalRecord } from '../lib/records';
import {
  anchorRecords,
  buildSnapshot,
  decryptVault,
  downloadJson,
  fetchAnchors,
  loadEncryptedVault,
  saveEncryptedVault,
} from '../lib/resilience';
import { awardTaskPoints, TASKS } from '../lib/points';
import { useToast } from '../contexts/ToastContext';

type Anchor = {
  id: string;
  record_id: string | null;
  content_hash: string;
  anchor_network: string;
  anchor_tx: string | null;
  created_at: string;
};

type VaultRow = {
  ciphertext: string;
  iv: string;
  salt: string;
  iterations: number;
  summary: string | null;
  updated_at: string;
};

export default function Resilience() {
  const supabase = createClient();
  const { success, error: toastError, info } = useToast();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patient, setPatient] = useState<Record<string, unknown> | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [vault, setVault] = useState<VaultRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [unlockPhrase, setUnlockPhrase] = useState('');
  const [restored, setRestored] = useState<{ records?: unknown[] } | null>(null);

  const load = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('patient_profiles')
        .select(
          'id, full_name, date_of_birth, blood_group, genotype, allergies, emergency_medical_info, emergency_contacts, phone'
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.id) {
        setPatientId(profile.id);
        setPatient(profile as Record<string, unknown>);
        const [nextRecords, nextAnchors, nextVault] = await Promise.all([
          fetchMedicalRecords(supabase),
          fetchAnchors(supabase, profile.id),
          loadEncryptedVault(supabase, profile.id),
        ]);
        setRecords(nextRecords);
        setAnchors(nextAnchors as Anchor[]);
        setVault(nextVault as VaultRow | null);
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Resilience data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [supabase, toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAnchors = async () => {
    if (!patientId) return;
    setBusy(true);
    try {
      const count = await anchorRecords(supabase, patientId, records);
      success(`${count} record hashes anchored and ready for on-chain verification.`);
      setAnchors((await fetchAnchors(supabase, patientId)) as Anchor[]);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Hashes could not be anchored.');
    } finally {
      setBusy(false);
    }
  };

  const createBackup = async () => {
    if (!patientId || !patient) return;
    if (passphrase.length < 8) {
      toastError('Use a recovery phrase with at least 8 characters.');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      toastError('The recovery phrases do not match.');
      return;
    }

    setBusy(true);
    try {
      const snapshot = buildSnapshot(patient, records);
      const encrypted = await saveEncryptedVault(supabase, patientId, passphrase, snapshot);
      downloadJson(`selorah-emergency-vault-${new Date().toISOString().slice(0, 10)}.json`, {
        type: 'selorah-emergency-vault',
        ...encrypted,
        createdAt: snapshot.createdAt,
      });
      setVault((await loadEncryptedVault(supabase, patientId)) as VaultRow | null);
      setPassphrase('');
      setConfirmPassphrase('');
      success('Encrypted backup created and downloaded. Keep the file somewhere safe.');

      const task = TASKS.find((item) => item.id === 'resilience-vault');
      if (task) {
        await awardTaskPoints(supabase, task).catch(() => undefined);
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'The backup could not be created.');
    } finally {
      setBusy(false);
    }
  };

  const verifyBackup = async () => {
    if (!vault) return;
    if (!unlockPhrase) {
      toastError('Enter your recovery phrase.');
      return;
    }

    setBusy(true);
    try {
      const payload = await decryptVault<{ records?: unknown[] }>(unlockPhrase, {
        ciphertext: vault.ciphertext,
        iv: vault.iv,
        salt: vault.salt,
        iterations: vault.iterations,
      });
      setRestored(payload);
      success(`Backup verified: ${payload.records?.length || 0} records recovered.`);
      setUnlockPhrase('');
    } catch {
      toastError('That recovery phrase could not unlock this backup.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-[28px] bg-white" />;
  }

  const anchored = anchors.length;
  const pending = anchors.filter((anchor) => anchor.anchor_network === 'pending').length;

  return (
    <div className="space-y-6 font-sora">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#6183FF]">
          Emergency resilience
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#101217] sm:text-3xl">
          Your records survive downtime
        </h2>
        <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-gray-400">
          Selorah keeps encrypted copies and cryptographic fingerprints of your records. If a
          server goes down, your card, your encrypted backup, and the hash trail still prove what
          was recorded.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Anchored records',
            value: String(anchored),
            hint: 'SHA-256 fingerprints',
            icon: FingerPrintIcon,
          },
          {
            label: 'Pending anchor',
            value: String(pending),
            hint: 'Queued for on-chain write',
            icon: CloudArrowUpIcon,
          },
          {
            label: 'Encrypted backup',
            value: vault ? 'Ready' : 'Not set',
            hint: vault?.summary || 'Create one below',
            icon: LockClosedIcon,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-[24px] border border-gray-50 bg-white p-5 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#6183FF]">
              <card.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#101217]">{card.value}</p>
            <p className="mt-1 text-[11px] font-medium text-gray-400">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#6183FF]">
              <FingerPrintIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#101217]">Anchor record hashes</h3>
              <p className="text-[11px] font-medium text-gray-400">
                A fingerprint proves a record was not changed.
              </p>
            </div>
          </div>

          <p className="mt-4 text-[11px] font-medium leading-relaxed text-gray-500">
            We hash each record on your device. The hash can be written to a public chain without
            exposing your health data. Until a chain writer is configured, hashes are stored as
            pending anchors and remain verifiable.
          </p>

          <button
            type="button"
            onClick={runAnchors}
            disabled={busy || records.length === 0}
            className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#6183FF] text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 disabled:opacity-50"
          >
            <ShieldCheckIcon className="h-4 w-4" />
            {busy ? 'Working...' : `Anchor ${records.length} records`}
          </button>

          {anchors.length > 0 && (
            <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
              {anchors.slice(0, 12).map((anchor) => (
                <div
                  key={anchor.id}
                  className="rounded-xl border border-gray-100 bg-[#F8F9FE] px-3 py-2"
                >
                  <p className="truncate font-mono text-[10px] font-semibold text-gray-600">
                    {anchor.content_hash.slice(0, 28)}...
                  </p>
                  <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">
                    {anchor.anchor_network} {anchor.anchor_tx ? `- ${anchor.anchor_tx}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-gray-50 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAFBF2] text-[#15955C]">
              <KeyIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#101217]">Encrypted emergency backup</h3>
              <p className="text-[11px] font-medium text-gray-400">
                Only your recovery phrase can open it.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <input
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              placeholder="Recovery phrase (8+ characters)"
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-3.5 text-xs font-semibold outline-none focus:border-[#6183FF]"
            />
            <input
              type="password"
              value={confirmPassphrase}
              onChange={(event) => setConfirmPassphrase(event.target.value)}
              placeholder="Repeat recovery phrase"
              className="min-h-[44px] w-full rounded-xl border border-gray-200 px-3.5 text-xs font-semibold outline-none focus:border-[#6183FF]"
            />
            <button
              type="button"
              onClick={createBackup}
              disabled={busy || records.length === 0}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#101217] text-xs font-bold text-white disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {busy ? 'Encrypting...' : 'Create and download backup'}
            </button>
          </div>

          {vault && (
            <div className="mt-4 rounded-2xl border border-[#15955C]/15 bg-[#EAFBF2]/60 p-3.5">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#15955C]">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Backup ready
              </p>
              <p className="mt-1 text-[11px] font-medium text-gray-500">{vault.summary}</p>
              <div className="mt-2 flex gap-2">
                <input
                  type="password"
                  value={unlockPhrase}
                  onChange={(event) => setUnlockPhrase(event.target.value)}
                  placeholder="Recovery phrase"
                  className="min-h-[40px] flex-1 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-semibold outline-none focus:border-[#6183FF]"
                />
                <button
                  type="button"
                  onClick={verifyBackup}
                  disabled={busy}
                  className="min-h-[40px] rounded-xl bg-[#15955C] px-3 text-[10px] font-black uppercase tracking-[0.08em] text-white disabled:opacity-60"
                >
                  Verify
                </button>
              </div>
              {restored && (
                <p className="mt-2 text-[11px] font-semibold text-[#15955C]">
                  Recovered {restored.records?.length || 0} records from the encrypted snapshot.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[24px] border border-[#6183FF]/15 bg-[#EEF2FF] p-4">
        <p className="flex items-start gap-2 text-[11px] font-medium leading-relaxed text-gray-600">
          <LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#6183FF]" />
          Health data is never written to a public chain. Only a hash and a pointer are anchored.
          The encrypted backup is the part that can restore your history if Selorah is unreachable.
        </p>
      </div>
    </div>
  );
}
