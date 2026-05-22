import { useState } from 'react';
import { XMarkIcon, QrCodeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';

interface ScanQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patientId: string, records: any[], recordId: string | null) => void;
}

export default function ScanQRModal({ isOpen, onClose, onSuccess }: ScanQRModalProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

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

      // 2. Fetch Patient Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', linkData.user_id)
        .single();

      if (profileError || !profileData) {
        throw new Error('Patient profile not found');
      }

      // 3. Fetch Records (if record_id is null, fetch all, else fetch specific)
      let query = supabase.from('medical_records').select('*').eq('user_id', linkData.user_id);
      
      if (linkData.record_id) {
        query = query.eq('id', linkData.record_id);
      }

      const { data: recordsData, error: recordsError } = await query;
      if (recordsError) throw recordsError;

      // Get current user (the hospital)
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Log access in access_logs
      await supabase.from('access_logs').insert({
        user_id: linkData.user_id, // the patient
        provider_id: currentUser?.id || null, // the hospital
        action: 'Viewed medical records via QR code',
        record_id: linkData.record_id || null
      });

      // Pass the data back to dashboard
      // We attach the fetched records to the profile data object for easy handling
      profileData.fetchedRecords = recordsData || [];
      
      onSuccess(profileData.id, recordsData || [], linkData.record_id);
      setToken('');
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full hover:bg-gray-100 transition-all">
          <XMarkIcon className="w-5 h-5" />
        </button>
        
        <div className="p-8 text-center border-b border-gray-50 bg-gray-50/50">
          <div className="w-16 h-16 bg-blue-50 text-[#6183FF] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <QrCodeIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#101217]">Scan QR Token</h2>
          <p className="text-gray-500 text-sm mt-2">Enter the token ID from the patient's QR code to securely access their records.</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Access Token</label>
            <input 
              type="text" 
              placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
              className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6183FF] transition-all font-mono"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
          
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
