import { useState } from 'react';
import { XMarkIcon, QrCodeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';

interface ScanQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patientId: string, records: any[], recordId: string | null, profile?: any) => void;
}

/**
 * Provider scan flow:
 * shared_links.user_id  →  patient_profiles.user_id  →  patient_profiles.id
 * medical_records.patient_id  →  patient_profiles.id   (NOT user_id)
 */
export default function ScanQRModal({ isOpen, onClose, onSuccess }: ScanQRModalProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();
  const { success: toastSuccess, error: toastError } = useToast();

  if (!isOpen) return null;

  const handleScan = async () => {
    if (!token.trim()) {
      setError('Please enter a valid token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Verify token
      const { data: linkData, error: linkError } = await supabase
        .from('shared_links')
        .select('*')
        .eq('token', token.trim())
        .single();

      if (linkError || !linkData) {
        throw new Error('Invalid or expired access token');
      }

      if (!linkData.is_active) {
        throw new Error('This token has been revoked by the patient');
      }

      if (new Date(linkData.expires_at) < new Date()) {
        throw new Error('This access token has expired');
      }

      // 2. Resolve patient_profiles (FK target for medical_records.patient_id)
      const { data: patientProfile, error: profileError } = await supabase
        .from('patient_profiles')
        .select('id, user_id, full_name, date_of_birth, blood_group, genotype, phone, nin')
        .eq('user_id', linkData.user_id)
        .maybeSingle();

      if (profileError) {
        console.warn('patient_profiles lookup:', profileError.message);
      }

      // Legacy fallback (older installs may still use profiles)
      let profileData: any = patientProfile;
      if (!profileData) {
        const { data: legacy } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', linkData.user_id)
          .maybeSingle();
        profileData = legacy;
      }

      if (!profileData) {
        throw new Error('Patient profile not found');
      }

      // 3. Fetch records by patient_id (column user_id does NOT exist on medical_records)
      let recordsData: any[] = [];
      const patientPk = patientProfile?.id || null;

      if (patientPk) {
        let query = supabase
          .from('medical_records')
          .select('*')
          .eq('patient_id', patientPk)
          .order('created_at', { ascending: false });

        if (linkData.record_id) {
          query = query.eq('id', linkData.record_id);
        }

        const { data, error: recordsError } = await query;
        if (recordsError) {
          throw new Error(recordsError.message || 'Failed to load medical records');
        }
        recordsData = data || [];
      }

      // 4. Best-effort access log (never block the UX)
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        await supabase.from('access_logs').insert({
          user_id: linkData.user_id,
          provider_id: currentUser?.id || null,
          action: 'Viewed medical records via QR code',
          record_id: linkData.record_id || null,
        });
      } catch {
        // ignore
      }

      const displayName =
        profileData.full_name ||
        [profileData.first_name, profileData.last_name].filter(Boolean).join(' ') ||
        'Scanned Patient';

      const enriched = {
        ...profileData,
        id: patientPk || profileData.id || linkData.user_id,
        name: displayName,
        nin: profileData.nin || null,
        fetchedRecords: recordsData,
      };

      onSuccess(enriched.id, recordsData, linkData.record_id, enriched);
      setToken('');
      onClose();
      toastSuccess(`Access granted for ${displayName}`);
    } catch (err: any) {
      const msg = err?.message || 'Unable to access records';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full hover:bg-gray-100 transition-all"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="p-8 text-center border-b border-gray-50 bg-gray-50/50">
          <div className="w-16 h-16 bg-blue-50 text-[#6183FF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <QrCodeIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#101217]">Scan QR Token</h2>
          <p className="text-gray-500 text-sm mt-2">
            Enter the token ID from the patient&apos;s QR code to securely access their records.
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Access Token
            </label>
            <input
              type="text"
              placeholder="e.g. 81993f0e-674b-4b00-8231-6ce1326edb9e"
              className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6183FF] transition-all font-mono"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <button
            onClick={handleScan}
            disabled={loading}
            className="w-full bg-[#6183FF] text-white py-4 rounded-2xl font-bold hover:bg-[#4E6EEF] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Access Records'} <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
