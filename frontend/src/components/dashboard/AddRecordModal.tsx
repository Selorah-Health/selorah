import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CameraIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  IdentificationIcon,
  PencilSquareIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../../lib/supabase/client';
import { useToast } from '../../contexts/ToastContext';
import { useSync } from '../../contexts/SyncContext';
import { ensurePatientProfile } from '../../lib/records/patientProfile';
import { insertMedicalRecord, uploadRecordFile } from '../../lib/records/storage';
import { extractTextFromImage } from '../../lib/ocr';
import { prepareImageFile } from '../../lib/images';
import {
  cacheRecord,
  saveRecordMetadata,
  textToDataUrl,
  notifyRecordsChanged,
} from '../../lib/offline/records';
import { createQueueId, enqueueAction } from '../../lib/offline/queue';

type Mode = 'scan' | 'upload' | 'manual' | 'profile';

type AddRecordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: Mode;
  onSaved?: () => void;
};

const CATEGORIES = [
  'Lab Results',
  'Imaging',
  'Prescriptions',
  'Visit Report',
  'Test Results',
  'Other Clinical',
];

const CATEGORY_TO_TYPE: Record<string, string> = {
  'Lab Results': 'Lab Results',
  Imaging: 'Imaging',
  Prescriptions: 'Prescription',
  'Visit Report': 'Visit Report',
  'Test Results': 'Test Results',
  'Other Clinical': 'Clinical Document',
};

const EMPTY_PROFILE = {
  height: '',
  weight: '',
  bloodGroup: '',
  genotype: '',
  allergies: '',
  familyHistory: '',
  medicationHistory: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
};

function titleFromOcr(text: string, fallback: string) {
  const firstLine = text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 2);
  if (!firstLine) return fallback;
  return firstLine.slice(0, 70);
}

export default function AddRecordModal({
  isOpen,
  onClose,
  defaultMode = 'scan',
  onSaved,
}: AddRecordModalProps) {
  const supabase = createClient();
  const navigate = useNavigate();
  const { success, error: toastError, info, warning } = useToast();
  const { online } = useSync();

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [captureSource, setCaptureSource] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [ocrState, setOcrState] = useState<'idle' | 'running' | 'done' | 'failed'>('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrMessage, setOcrMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE);
  const [savingProfile, setSavingProfile] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMode(defaultMode);
    setTitle('');
    setCategory(CATEGORIES[0]);
    setNotes('');
    setRecordDate(new Date().toISOString().slice(0, 10));
    setImageDataUrl(null);
    setFileName('');
    setMimeType('');
    setOcrText('');
    setOcrState('idle');
    setOcrProgress(0);
    setOcrMessage('');
    setProfileForm(EMPTY_PROFILE);
  }, [defaultMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, saving]);

  if (!isOpen) return null;

  const runOcr = async (dataUrl: string) => {
    if (!navigator.onLine) {
      setOcrState('failed');
      setOcrMessage('Offline. Your photo is saved, and text can be added manually.');
      return;
    }

    setOcrState('running');
    setOcrProgress(0);
    setOcrMessage('Preparing text recognition');
    try {
      const text = await extractTextFromImage(dataUrl, (progress, status) => {
        setOcrProgress(Math.round(progress * 100));
        setOcrMessage(status === 'recognizing text' ? 'Reading document text' : 'Preparing text recognition');
      });
      setOcrText(text);
      setOcrState(text ? 'done' : 'failed');
      setOcrMessage(text ? 'Text extracted. Review it before saving.' : 'No readable text found. You can type it in.');
      if (text && !title) setTitle(titleFromOcr(text, 'Scanned Document'));
    } catch (error) {
      setOcrState('failed');
      setOcrMessage(
        error instanceof Error && /connection/i.test(error.message)
          ? 'Text recognition needs a connection. Your photo is still saved.'
          : 'Could not read text automatically. You can type or edit it below.'
      );
    }
  };

  const handleFile = async (file: File, source: 'camera' | 'upload') => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      warning('Choose an image or PDF document.');
      return;
    }

    setMode(source === 'camera' ? 'scan' : 'upload');
    setCaptureSource(source);
    setOcrText('');
    setOcrState('idle');
    setOcrMessage('');

    try {
      const prepared = await prepareImageFile(file);
      setImageDataUrl(prepared.dataUrl);
      setFileName(prepared.fileName || file.name);
      setMimeType(prepared.mimeType || file.type);
      setTitle((prev) => prev || prepared.fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
      if (prepared.mimeType.startsWith('image/')) {
        void runOcr(prepared.dataUrl);
      }
    } catch {
      toastError('Could not open that file. Try another one.');
    }
  };

  const queueRecord = async (input: {
    localId: string;
    titleValue: string;
    recordType: string;
    fileUrl: string;
    ocr: string;
    noteText: string;
    capturedVia: 'camera' | 'upload' | 'manual';
    patientId?: string;
  }) => {
    await cacheRecord({
      id: input.localId,
      name: input.titleValue,
      date: new Date(recordDate || Date.now()).toLocaleDateString(),
      status: 'Pending sync',
      icon: '/assets/total-records-card-icon.png',
      document_url: input.fileUrl,
      record_type: input.recordType,
      created_at: new Date().toISOString(),
      pending: true,
      ocrText: input.ocr,
      notes: input.noteText,
      capturedVia: input.capturedVia,
    });

    await saveRecordMetadata(input.localId, {
      ocrText: input.ocr,
      notes: input.noteText,
      capturedVia: input.capturedVia,
      ocrStatus: input.ocr ? 'done' : input.capturedVia === 'manual' ? 'done' : 'pending',
    });

    await enqueueAction({
      type: 'record.create',
      payload: {
        patientId: input.patientId,
        title: input.titleValue,
        recordType: input.recordType,
        fileUrl: input.fileUrl,
        fileName: fileName || undefined,
        mimeType,
        ocrText: input.ocr || undefined,
        notes: input.noteText || undefined,
        capturedVia: input.capturedVia,
        localId: input.localId,
        createdAt: new Date().toISOString(),
      },
    });
  };

  const handleSaveRecord = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      warning('Add a title so you can find this record later.');
      return;
    }
    if (!imageDataUrl && mode !== 'manual') {
      warning('Take a photo or choose a file first.');
      return;
    }
    if (mode === 'manual' && !notes.trim() && !ocrText.trim()) {
      warning('Add some notes or extracted text for this record.');
      return;
    }

    setSaving(true);
    const localId = createQueueId('local');
    const recordType = CATEGORY_TO_TYPE[category] || 'Clinical Document';
    const noteText = notes.trim();

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        const fileUrl = imageDataUrl || textToDataUrl([noteText, ocrText].filter(Boolean).join('\n\n'));
        await queueRecord({
          localId,
          titleValue: cleanTitle,
          recordType,
          fileUrl,
          ocr: ocrText.trim(),
          noteText,
          capturedVia: mode === 'manual' ? 'manual' : captureSource,
        });
        notifyRecordsChanged();
        success('Saved on this device. Sign in to sync it to your account.', 'Record saved');
        onSaved?.();
        onClose();
        return;
      }

      if (!online) {
        const fileUrl = imageDataUrl || textToDataUrl([noteText, ocrText].filter(Boolean).join('\n\n'));
        await queueRecord({
          localId,
          titleValue: cleanTitle,
          recordType,
          fileUrl,
          ocr: ocrText.trim(),
          noteText,
          capturedVia: mode === 'manual' ? 'manual' : captureSource,
        });
        notifyRecordsChanged();
        success('Saved offline. It will sync when you are back online.', 'Queued');
        onSaved?.();
        onClose();
        return;
      }

      let fileUrl = imageDataUrl || textToDataUrl([noteText, ocrText].filter(Boolean).join('\n\n'));

      if (imageDataUrl) {
        const uploaded = await uploadRecordFile(supabase as SupabaseClient, user.id, {
          dataUrl: imageDataUrl,
          fileName: fileName || `${cleanTitle}.jpg`,
          mimeType,
        });
        fileUrl = uploaded.fileUrl;
      }

      const patientProfile = await ensurePatientProfile(supabase as SupabaseClient, user);
      if (!patientProfile) throw new Error('Your patient profile is not ready yet.');

      const { data, error } = await insertMedicalRecord(supabase as SupabaseClient, {
        patient_id: patientProfile.id,
        title: cleanTitle,
        record_type: recordType,
        file_url: fileUrl,
        status: 'active',
        encrypted: true,
        ocr_text: ocrText.trim() || null,
        notes: noteText || null,
        captured_via: mode === 'manual' ? 'manual' : captureSource,
      });

      if (error) throw error;

      const saved = data as Record<string, unknown> | null;
      const recordId = saved?.id ? String(saved.id) : localId;

      await saveRecordMetadata(recordId, {
        ocrText: ocrText.trim(),
        notes: noteText,
        capturedVia: mode === 'manual' ? 'manual' : captureSource,
        ocrStatus: ocrText.trim() ? 'done' : 'pending',
      });

      await cacheRecord({
        id: recordId,
        name: cleanTitle,
        date: saved?.created_at
          ? new Date(String(saved.created_at)).toLocaleDateString()
          : new Date(recordDate || Date.now()).toLocaleDateString(),
        status: 'Encrypted',
        icon: '/assets/total-records-card-icon.png',
        document_url: fileUrl,
        record_type: recordType,
        created_at: saved?.created_at ? String(saved.created_at) : new Date().toISOString(),
        ocrText: ocrText.trim(),
        notes: noteText,
        capturedVia: mode === 'manual' ? 'manual' : captureSource,
      });

      notifyRecordsChanged();
      success('Your record is saved and encrypted.', 'Record added');
      onSaved?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save the record.';

      if (/Failed to fetch|NetworkError|Load failed|fetch failed/i.test(message)) {
        const fileUrl = imageDataUrl || textToDataUrl([noteText, ocrText].filter(Boolean).join('\n\n'));
        await queueRecord({
          localId,
          titleValue: cleanTitle,
          recordType,
          fileUrl,
          ocr: ocrText.trim(),
          noteText,
          capturedVia: mode === 'manual' ? 'manual' : captureSource,
        });
        notifyRecordsChanged();
        success('Connection dropped. The record is saved on this device.', 'Queued');
        onSaved?.();
        onClose();
        return;
      }

      toastError(message, 'Could not save record');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    const entries: { title: string; content: string; recordType: string; profileKey?: string }[] = [];
    if (profileForm.height.trim()) entries.push({ title: 'Height', content: profileForm.height.trim(), recordType: 'Vital' });
    if (profileForm.weight.trim()) entries.push({ title: 'Weight', content: profileForm.weight.trim(), recordType: 'Vital' });
    if (profileForm.bloodGroup.trim()) entries.push({ title: 'Blood Group', content: profileForm.bloodGroup.trim(), recordType: 'Vital', profileKey: 'blood_group' });
    if (profileForm.genotype.trim()) entries.push({ title: 'Genotype', content: profileForm.genotype.trim(), recordType: 'Vital', profileKey: 'genotype' });
    if (profileForm.allergies.trim()) entries.push({ title: 'Allergies', content: profileForm.allergies.trim(), recordType: 'Allergy' });
    if (profileForm.familyHistory.trim()) entries.push({ title: 'Family History', content: profileForm.familyHistory.trim(), recordType: 'History' });
    if (profileForm.medicationHistory.trim()) entries.push({ title: 'Medication History', content: profileForm.medicationHistory.trim(), recordType: 'History' });
    if (profileForm.emergencyName.trim() || profileForm.emergencyPhone.trim()) {
      entries.push({
        title: 'Emergency Contact',
        content: [profileForm.emergencyName.trim(), profileForm.emergencyRelation.trim(), profileForm.emergencyPhone.trim()]
          .filter(Boolean)
          .join(' - '),
        recordType: 'Emergency Contact',
      });
    }

    if (!entries.length) {
      warning('Fill in at least one field before saving.');
      return;
    }

    setSavingProfile(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        warning('Sign in to save profile fields to your account.');
        navigate('/login');
        return;
      }
      if (!online) {
        localStorage.setItem(
          'selorah_profile_draft',
          JSON.stringify({ ...profileForm, savedAt: new Date().toISOString() })
        );
        info('Profile details saved on this device. Sync will finish when you are online.');
        onClose();
        return;
      }

      const patientProfile = await ensurePatientProfile(supabase as SupabaseClient, user);
      if (!patientProfile) throw new Error('Your patient profile is not ready yet.');

      for (const entry of entries) {
        const { error } = await insertMedicalRecord(supabase as SupabaseClient, {
          patient_id: patientProfile.id,
          title: entry.title,
          record_type: entry.recordType,
          file_url: textToDataUrl(entry.content),
          status: 'active',
          encrypted: true,
          notes: entry.content,
        });
        if (error) throw error;
      }

      const profilePatch = Object.fromEntries(
        entries.filter((entry) => entry.profileKey).map((entry) => [entry.profileKey, entry.content])
      );
      if (Object.keys(profilePatch).length) {
        await supabase.from('patient_profiles').update(profilePatch).eq('id', patientProfile.id);
      }

      localStorage.removeItem('selorah_profile_draft');
      success(`${entries.length} profile field${entries.length === 1 ? '' : 's'} saved.`, 'Profile updated');
      onSaved?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save profile fields.';
      if (/Failed to fetch|NetworkError|Load failed|fetch failed/i.test(message)) {
        localStorage.setItem(
          'selorah_profile_draft',
          JSON.stringify({ ...profileForm, savedAt: new Date().toISOString() })
        );
        info('Profile details saved on this device. Sync will finish when you are online.');
        onClose();
      } else {
        toastError(message, 'Could not save profile');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const tabs: { id: Mode; label: string; icon: typeof CameraIcon }[] = [
    { id: 'scan', label: 'Scan', icon: CameraIcon },
    { id: 'upload', label: 'Upload', icon: ArrowUpTrayIcon },
    { id: 'manual', label: 'Manual', icon: PencilSquareIcon },
    { id: 'profile', label: 'Profile', icon: IdentificationIcon },
  ];

  const isRecordMode = mode !== 'profile';

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[#0A0B14]/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <button type="button" aria-label="Close add record" className="absolute inset-0" onClick={onClose} />
      <div className="mobile-sheet relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-xl sm:rounded-[32px]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-xl font-black text-[#101217]">Add a record</h3>
            <p className="text-xs font-medium text-gray-400">
              {isRecordMode ? 'Photograph, upload, or type it in.' : 'Update your health profile.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-4 mt-4 grid shrink-0 grid-cols-4 gap-1 rounded-2xl bg-gray-50 p-1 sm:mx-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMode(tab.id);
                  if (tab.id === 'manual' && !imageDataUrl) {
                    setTitle((prev) => prev || '');
                  }
                }}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-black uppercase tracking-wide transition-all ${
                  active ? 'bg-white text-[#6183FF] shadow-sm' : 'text-gray-400'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {mode === 'profile' ? (
            <div className="space-y-4">
              <p className="rounded-2xl bg-[#F8F9FE] p-3 text-xs font-medium leading-relaxed text-gray-500">
                These fields update your emergency profile. They stay separate from clinical records.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['height', 'Height', 'e.g. 182 cm'],
                  ['weight', 'Weight', 'e.g. 75 kg'],
                  ['bloodGroup', 'Blood group', 'e.g. O+'],
                  ['genotype', 'Genotype', 'e.g. AA'],
                ].map(([key, label, placeholder]) => (
                  <label key={key} className="block">
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {label}
                    </span>
                    <input
                      value={profileForm[key as keyof typeof profileForm]}
                      onChange={(event) =>
                        setProfileForm((prev) => ({ ...prev, [key]: event.target.value }))
                      }
                      placeholder={placeholder}
                      className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-base font-bold text-gray-700 outline-none focus:border-[#6183FF]"
                    />
                  </label>
                ))}
              </div>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Allergies
                </span>
                <input
                  value={profileForm.allergies}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, allergies: event.target.value }))}
                  placeholder="e.g. Penicillin, Peanuts"
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-base font-bold text-gray-700 outline-none focus:border-[#6183FF]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Family history
                </span>
                <textarea
                  value={profileForm.familyHistory}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, familyHistory: event.target.value }))}
                  rows={2}
                  placeholder="e.g. Hypertension on father's side"
                  className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-base font-medium text-gray-700 outline-none focus:border-[#6183FF]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Medication history
                </span>
                <textarea
                  value={profileForm.medicationHistory}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, medicationHistory: event.target.value }))}
                  rows={2}
                  placeholder="e.g. Metformin 500mg"
                  className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-base font-medium text-gray-700 outline-none focus:border-[#6183FF]"
                />
              </label>
              <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Emergency contact</p>
                <input
                  value={profileForm.emergencyName}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, emergencyName: event.target.value }))}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-gray-100 bg-white px-3 py-3 text-base font-bold text-gray-700 outline-none focus:border-[#6183FF]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={profileForm.emergencyRelation}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, emergencyRelation: event.target.value }))}
                    placeholder="Relationship"
                    className="w-full rounded-xl border border-gray-100 bg-white px-3 py-3 text-base font-bold text-gray-700 outline-none focus:border-[#6183FF]"
                  />
                  <input
                    value={profileForm.emergencyPhone}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, emergencyPhone: event.target.value }))}
                    placeholder="Phone"
                    inputMode="tel"
                    className="w-full rounded-xl border border-gray-100 bg-white px-3 py-3 text-base font-bold text-gray-700 outline-none focus:border-[#6183FF]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="w-full rounded-2xl bg-[#6183FF] py-4 text-base font-bold text-white transition-all hover:bg-[#4E6EEF] disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save profile fields'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file, 'camera');
                  event.target.value = '';
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file, 'upload');
                  event.target.value = '';
                }}
              />

              {mode !== 'manual' && !imageDataUrl && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex min-h-[132px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#6183FF]/40 bg-[#6183FF]/5 p-4 text-[#6183FF]"
                  >
                    <CameraIcon className="h-8 w-8" />
                    <span className="text-sm font-bold">Take a photo</span>
                    <span className="text-[11px] font-medium text-[#6183FF]/70">Camera or phone gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex min-h-[132px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-gray-500"
                  >
                    <ArrowUpTrayIcon className="h-8 w-8 text-[#6183FF]" />
                    <span className="text-sm font-bold text-[#101217]">Choose a file</span>
                    <span className="text-[11px] font-medium text-gray-400">Image or PDF</span>
                  </button>
                </div>
              )}

              {mode !== 'manual' && imageDataUrl && (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                  <div className="relative">
                    {mimeType.startsWith('image/') ? (
                      <img src={imageDataUrl} alt="Document preview" className="max-h-[220px] w-full object-cover" />
                    ) : (
                      <div className="flex h-32 items-center justify-center gap-2 text-sm font-bold text-gray-500">
                        <DocumentTextIcon className="h-6 w-6 text-[#6183FF]" />
                        {fileName || 'PDF document'}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setImageDataUrl(null);
                        setFileName('');
                        setMimeType('');
                        setOcrText('');
                        setOcrState('idle');
                      }}
                      className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-bold text-white"
                    >
                      Replace
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#101217]">{fileName || 'Document ready'}</p>
                      <p className="text-[10px] font-medium text-gray-400">
                        {ocrState === 'running'
                          ? `Reading text ${ocrProgress}%`
                          : ocrState === 'done'
                            ? 'Text extracted'
                            : ocrState === 'failed'
                              ? 'Added without automatic text'
                              : 'Ready to save'}
                      </p>
                    </div>
                    {ocrState === 'running' && <ArrowPathIcon className="h-5 w-5 shrink-0 animate-spin text-[#6183FF]" />}
                    {ocrState === 'done' && <CheckCircleIcon className="h-5 w-5 shrink-0 text-green-500" />}
                    {mimeType.startsWith('image/') && ocrState !== 'running' && (
                      <button
                        type="button"
                        onClick={() => void runOcr(imageDataUrl)}
                        className="shrink-0 text-[11px] font-bold text-[#6183FF] hover:underline"
                      >
                        {ocrState === 'done' ? 'Read again' : 'Read text'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Record title *
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Full blood count, March 2026"
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-base font-bold text-gray-700 outline-none focus:border-[#6183FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Type
                  </span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#6183FF]"
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Date
                  </span>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(event) => setRecordDate(event.target.value)}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#6183FF]"
                  />
                </label>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Extracted text
                  </label>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#6183FF]">
                    <SparklesIcon className="h-3.5 w-3.5" /> OCR
                  </span>
                </div>
                <textarea
                  value={ocrText}
                  onChange={(event) => setOcrText(event.target.value)}
                  rows={4}
                  placeholder="Text from the document appears here. You can correct it before saving."
                  className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-base leading-relaxed text-gray-700 outline-none focus:border-[#6183FF]"
                />
                {ocrMessage && (
                  <p className={`mt-1.5 text-[11px] font-medium ${ocrState === 'failed' ? 'text-amber-600' : 'text-gray-400'}`}>
                    {ocrMessage}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Anything your doctor should know about this record."
                  className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-base leading-relaxed text-gray-700 outline-none focus:border-[#6183FF]"
                />
              </div>

              <div className="rounded-2xl bg-[#F8F9FE] px-4 py-3 text-[11px] font-medium leading-relaxed text-gray-500">
                {online
                  ? 'Your image and extracted text are stored together. The image is the original; the text makes it searchable.'
                  : 'You are offline. This record is saved on this device and syncs automatically when the connection returns.'}
              </div>

              <button
                type="button"
                onClick={handleSaveRecord}
                disabled={saving || ocrState === 'running'}
                className="w-full rounded-2xl bg-[#6183FF] py-4 text-base font-bold text-white transition-all hover:bg-[#4E6EEF] disabled:opacity-50"
              >
                {saving ? 'Saving record...' : ocrState === 'running' ? 'Reading document...' : 'Save record'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
