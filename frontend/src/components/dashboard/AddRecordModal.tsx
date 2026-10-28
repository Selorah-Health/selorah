import { useEffect, useRef, useState } from 'react';
<<<<<<< HEAD
import { useNavigate } from 'react-router-dom';
=======
import type { SupabaseClient } from '@supabase/supabase-js';
>>>>>>> 908a1e70 (Version 1.3)
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CameraIcon,
  CheckCircleIcon,
<<<<<<< HEAD
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
=======
  CloudArrowUpIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  HeartIcon,
  IdentificationIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../../lib/supabase/client';
import { useToast } from '../../contexts/ToastContext';
import {
  ensurePatientProfile,
  FILE_CATEGORY_TO_TYPE,
  insertMedicalRecord,
  RECORD_CATEGORIES,
} from '../../lib/records';
import { dataUrlToBlob, prepareImageFile, readFileAsDataUrl } from '../../lib/images';
import { correctOcrText, extractTextFromImage, prewarmOcr } from '../../lib/ocr';

type Mode = 'profile' | 'file';

type ProfileForm = {
  height: string;
  weight: string;
  bloodGroup: string;
  genotype: string;
  allergies: string;
  familyHistory: string;
  medicationHistory: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
};

type OcrState = 'idle' | 'running' | 'done' | 'failed';

const EMPTY_FORM: ProfileForm = {
>>>>>>> 908a1e70 (Version 1.3)
  height: '',
  weight: '',
  bloodGroup: '',
  genotype: '',
  allergies: '',
  familyHistory: '',
  medicationHistory: '',
  emergencyName: '',
<<<<<<< HEAD
  emergencyPhone: '',
  emergencyRelation: '',
};

function titleFromOcr(text: string, fallback: string) {
=======
  emergencyRelation: '',
  emergencyPhone: '',
};

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_INLINE_BYTES = 4 * 1024 * 1024;

function humanFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIsAllowed(file: File) {
  return (
    file.type.startsWith('image/') ||
    file.type === 'application/pdf' ||
    file.type.includes('word') ||
    file.type === 'text/plain'
  );
}

function titleFromFileName(name: string) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function titleFromOcr(text: string) {
>>>>>>> 908a1e70 (Version 1.3)
  const firstLine = text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 2);
<<<<<<< HEAD
  if (!firstLine) return fallback;
  return firstLine.slice(0, 70);
=======
  return firstLine ? firstLine.slice(0, 80) : '';
}

function friendlyInsertError(message: string) {
  if (/row-level security|permission denied|not allowed/i.test(message)) {
    return 'Your account is not allowed to save records yet. The medical_records insert policy is blocking this save.';
  }
  if (/violates foreign key|patient_id/i.test(message)) {
    return 'Your patient profile is not linked correctly. Refresh the page and try again.';
  }
  if (/schema cache|column .* does not exist/i.test(message)) {
    return 'The records table is missing a column this form needs. Apply the latest Supabase migration and try again.';
  }
  return message;
>>>>>>> 908a1e70 (Version 1.3)
}

export default function AddRecordModal({
  isOpen,
  onClose,
<<<<<<< HEAD
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
=======
  onSaved,
}: AddRecordModalProps) {
  const supabase = createClient();
  const { success: toastSuccess, error: toastError, warning, info } = useToast();

  const [mode, setMode] = useState<Mode>('profile');
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [preparedUrl, setPreparedUrl] = useState('');
  const [preparedMime, setPreparedMime] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(RECORD_CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrMessage, setOcrMessage] = useState('');
  const [readingFile, setReadingFile] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const ocrRunRef = useRef(0);
  const autoTitleRef = useRef('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      ocrRunRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setMode('profile');
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewUrl('');
    setPreparedUrl('');
    setPreparedMime('');
    setTitle('');
    setCategory(RECORD_CATEGORIES[0]);
    setNotes('');
>>>>>>> 908a1e70 (Version 1.3)
    setOcrText('');
    setOcrState('idle');
    setOcrProgress(0);
    setOcrMessage('');
<<<<<<< HEAD
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
=======
    setErrorMsg(null);
    setReadingFile(false);
    autoTitleRef.current = '';
    ocrRunRef.current += 1;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow || '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose, saving]);

  useEffect(() => {
    if (isOpen && mode === 'file') void prewarmOcr();
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const update = (key: keyof ProfileForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const runOcr = async (file: File) => {
    const runId = ocrRunRef.current + 1;
    ocrRunRef.current = runId;

    setOcrState('running');
    setOcrProgress(0);
    setOcrMessage('Getting the text engine ready');

    try {
      const text = await extractTextFromImage(file, (progress, status) => {
        if (ocrRunRef.current !== runId) return;
        setOcrProgress(Math.round(progress * 100));
        if (status === 'recognizing text') {
          setOcrMessage('Reading document text');
        } else if (status.includes('language')) {
          setOcrMessage('Loading language data');
        } else if (status.includes('initializing')) {
          setOcrMessage('Starting the recognizer');
        } else {
          setOcrMessage('Preparing text recognition');
        }
      });

      if (ocrRunRef.current !== runId || !mountedRef.current) return;

      setOcrText(text);
      setOcrState(text ? 'done' : 'failed');
      setOcrProgress(100);
      setOcrMessage(
        text
          ? 'Text extracted and cleaned up. Check it before saving.'
          : 'No readable text found. You can type it in below.'
      );

      const suggested = titleFromOcr(text);
      if (suggested && (!title.trim() || title === autoTitleRef.current)) {
        setTitle(suggested);
        autoTitleRef.current = suggested;
      }
    } catch (error) {
      if (ocrRunRef.current !== runId || !mountedRef.current) return;
      setOcrState('failed');
      setOcrMessage(
        error instanceof Error && /connection/i.test(error.message)
          ? 'Text recognition needs a connection the first time it runs.'
          : 'Automatic reading failed. You can type the text in below.'
>>>>>>> 908a1e70 (Version 1.3)
      );
    }
  };

<<<<<<< HEAD
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
=======
  const handleFile = async (file?: File | null) => {
    if (!file) return;

    setErrorMsg(null);

    if (!fileIsAllowed(file)) {
      setErrorMsg('Use a PDF, image, Word document, or text file.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrorMsg('Files must be 10 MB or smaller.');
      return;
    }

    setReadingFile(true);
    setSelectedFile(file);
    setOcrText('');
    setOcrState('idle');
    setOcrProgress(0);
    setOcrMessage('');
    setCategory(RECORD_CATEGORIES[0]);

    const suggestedTitle = titleFromFileName(file.name);
    if (!title.trim()) {
      setTitle(suggestedTitle);
      autoTitleRef.current = suggestedTitle;
    }

    try {
      if (file.type.startsWith('image/')) {
        const prepared = await prepareImageFile(file);
        if (!mountedRef.current) return;
        setPreviewUrl(prepared.dataUrl);
        setPreparedUrl(prepared.dataUrl);
        setPreparedMime(prepared.mimeType);
        void runOcr(file);
      } else {
        const dataUrl = await readFileAsDataUrl(file);
        if (!mountedRef.current) return;
        setPreviewUrl('');
        setPreparedUrl(dataUrl);
        setPreparedMime(file.type || 'application/octet-stream');
      }
    } catch {
      setErrorMsg('Could not open that file. Try another one.');
      setSelectedFile(null);
    } finally {
      if (mountedRef.current) setReadingFile(false);
    }
  };

  const clearFile = () => {
    ocrRunRef.current += 1;
    setSelectedFile(null);
    setPreviewUrl('');
    setPreparedUrl('');
    setPreparedMime('');
    setOcrText('');
    setOcrState('idle');
    setOcrProgress(0);
    setOcrMessage('');
    setErrorMsg(null);
  };

  const buildEntries = () => {
    const entries: {
      title: string;
      content: string;
      recordType: string;
      profileKey?: 'height' | 'weight' | 'blood_group' | 'genotype';
    }[] = [];

    if (form.height.trim())
      entries.push({ title: 'Height', content: form.height.trim(), recordType: 'Vital', profileKey: 'height' });
    if (form.weight.trim())
      entries.push({ title: 'Weight', content: form.weight.trim(), recordType: 'Vital', profileKey: 'weight' });
    if (form.bloodGroup.trim())
      entries.push({
        title: 'Blood Group',
        content: form.bloodGroup.trim(),
        recordType: 'Vital',
        profileKey: 'blood_group',
      });
    if (form.genotype.trim())
      entries.push({
        title: 'Genotype',
        content: form.genotype.trim(),
        recordType: 'Vital',
        profileKey: 'genotype',
      });
    if (form.allergies.trim())
      entries.push({ title: 'Allergies', content: form.allergies.trim(), recordType: 'Allergy' });
    if (form.familyHistory.trim())
      entries.push({ title: 'Family History', content: form.familyHistory.trim(), recordType: 'History' });
    if (form.medicationHistory.trim())
      entries.push({
        title: 'Medication History',
        content: form.medicationHistory.trim(),
        recordType: 'History',
      });
    if (form.emergencyName.trim() || form.emergencyPhone.trim()) {
      const content = [
        form.emergencyName.trim(),
        form.emergencyRelation.trim(),
        form.emergencyPhone.trim(),
      ]
        .filter(Boolean)
        .join(' - ');
      entries.push({
        title: 'Emergency Contact',
        content,
>>>>>>> 908a1e70 (Version 1.3)
        recordType: 'Emergency Contact',
      });
    }

<<<<<<< HEAD
=======
    return entries;
  };

  const getProfile = async (user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) => {
    let profile = await ensurePatientProfile(supabase as SupabaseClient, {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    });

    if (profile) return profile;

    const { data, error } = await supabase
      .from('patient_profiles')
      .insert({ user_id: user.id })
      .select('id')
      .maybeSingle();

    if (data?.id) return { id: data.id };

    if (error?.message) {
      throw new Error(`Patient profile could not be created: ${error.message}`);
    }

    throw new Error('We could not open your patient profile. Refresh the page and try again.');
  };

  const saveProfile = async () => {
    setErrorMsg(null);
    const entries = buildEntries();
>>>>>>> 908a1e70 (Version 1.3)
    if (!entries.length) {
      warning('Fill in at least one field before saving.');
      return;
    }

<<<<<<< HEAD
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
=======
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErrorMsg('Your session expired. Please log in again.');
        return;
      }

      const profile = await getProfile(user);

      for (const entry of entries) {
        const contentUrl =
          'data:text/plain;charset=utf-8,' + encodeURIComponent(entry.content);
        const { error } = await insertMedicalRecord(supabase as SupabaseClient, {
          patient_id: profile.id,
          title: entry.title,
          record_type: entry.recordType,
          file_url: contentUrl,
>>>>>>> 908a1e70 (Version 1.3)
          status: 'active',
          encrypted: true,
          notes: entry.content,
        });
<<<<<<< HEAD
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
=======
        if (error) throw new Error(error.message);
      }

      const patch: Record<string, unknown> = {};
      entries.forEach((entry) => {
        if (entry.profileKey) patch[entry.profileKey] = entry.content;
      });
      if (form.emergencyName.trim()) {
        patch.emergency_contacts = [
          {
            name: form.emergencyName.trim(),
            relationship: form.emergencyRelation.trim(),
            phone: form.emergencyPhone.trim(),
          },
        ];
      }
      if (Object.keys(patch).length) {
        const { error: patchError } = await supabase
          .from('patient_profiles')
          .update(patch)
          .eq('id', profile.id);
        if (patchError && !/column .* does not exist/i.test(patchError.message)) {
          console.warn('Profile field update skipped:', patchError.message);
        }
      }

      try {
        await onSaved();
      } catch {
        // The record is already saved. A refresh failure should not hide that.
      }
      toastSuccess(
        `${entries.length} field${entries.length > 1 ? 's' : ''} saved to your health profile.`,
        'Profile updated'
      );
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save your profile.';
      setErrorMsg(friendlyInsertError(message));
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (
    user: { id: string },
    file: File,
    prepared: string,
    mime: string
  ) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'document';
    const path = `${user.id}/${Date.now()}_${safeName}`;
    const blob =
      mime.startsWith('image/') && prepared.startsWith('data:')
        ? await dataUrlToBlob(prepared)
        : file;

    const { error } = await supabase.storage.from('records').upload(path, blob, {
      contentType: mime || blob.type || 'application/octet-stream',
      upsert: false,
    });

    if (!error) {
      const { data } = supabase.storage.from('records').getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    }

    if (prepared && file.size <= MAX_INLINE_BYTES) return prepared;

    throw new Error(
      'The secure storage bucket is unavailable. Try a smaller file or try again later.'
    );
  };

  const saveRecord = async () => {
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Give this record a name so you can find it later.');
      return;
    }
    if (!selectedFile) {
      setErrorMsg('Take a photo or choose a file first.');
      return;
    }
    if (!preparedUrl) {
      setErrorMsg('That file is still being prepared. Try again in a moment.');
      return;
    }

    setSaving(true);
    ocrRunRef.current += 1;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErrorMsg('Your session expired. Please log in again.');
        return;
      }

      const profile = await getProfile(user);
      const fileUrl = await uploadFile(
        user,
        selectedFile,
        preparedUrl,
        preparedMime || selectedFile.type
      );

      const { error } = await insertMedicalRecord(supabase as SupabaseClient, {
        patient_id: profile.id,
        title: title.trim(),
        record_type: FILE_CATEGORY_TO_TYPE[category] || 'Clinical Document',
        file_url: fileUrl,
        status: 'active',
        encrypted: true,
        ocr_text: ocrText.trim() || null,
        notes: notes.trim() || null,
        captured_via: selectedFile.type.startsWith('image/') ? 'scan' : 'upload',
      });

      if (error) throw new Error(error.message);

      try {
        await onSaved();
      } catch {
        // The insert already succeeded. Do not show a false save failure.
      }

      toastSuccess('Your record is saved and encrypted.', 'Record added');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save this record.';
      setErrorMsg(friendlyInsertError(message));
      toastError(friendlyInsertError(message), 'Record not saved');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'min-h-[46px] w-full rounded-xl border border-gray-100 bg-gray-50 px-3.5 text-sm font-semibold text-gray-700 outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF] focus:bg-white';

  const isImage = Boolean(selectedFile?.type.startsWith('image/'));

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-[#05081A]/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-record-title"
    >
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-gray-100 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-[32px]">
        <div className="relative shrink-0 overflow-hidden border-b border-gray-100 px-5 pb-5 pt-5 sm:px-7 sm:pb-6 sm:pt-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#6183FF]/10 blur-3xl"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6183FF] to-[#4D6ED6] text-white shadow-lg shadow-[#6183FF]/25">
                <CloudArrowUpIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 id="add-record-title" className="text-lg font-bold tracking-tight text-[#101217] sm:text-xl">
                  Add to your record
                </h3>
                <p className="text-xs font-medium text-gray-400 sm:text-[13px]">
                  Scan, upload, or update your health profile.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close add record"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            >
              <span aria-hidden className="text-lg leading-none">&times;</span>
            </button>
          </div>

          <div className="relative mt-5 flex rounded-2xl bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setMode('profile')}
              className={`flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-bold transition-all ${
                mode === 'profile'
                  ? 'bg-white text-[#101217] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <HeartIcon className="h-4 w-4" />
              Health profile
            </button>
            <button
              type="button"
              onClick={() => setMode('file')}
              className={`flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-bold transition-all ${
                mode === 'file'
                  ? 'bg-white text-[#101217] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <CameraIcon className="h-4 w-4" />
              Scan or upload
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
            >
              <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'profile' ? (
            <>
              <p className="rounded-2xl bg-[#F8F9FE] px-4 py-3 text-xs font-medium leading-relaxed text-gray-500">
                These details power your emergency profile and give clinicians context. They stay
                out of your clinical records list.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Height" placeholder="e.g. 182 cm" value={form.height} onChange={(value) => update('height', value)} />
                <Field label="Weight" placeholder="e.g. 75 kg" value={form.weight} onChange={(value) => update('weight', value)} />
                <Field label="Blood group" placeholder="e.g. O+" value={form.bloodGroup} onChange={(value) => update('bloodGroup', value)} />
                <Field label="Genotype" placeholder="e.g. AA" value={form.genotype} onChange={(value) => update('genotype', value)} />
              </div>

              <Field label="Allergies" placeholder="e.g. Penicillin, peanuts" value={form.allergies} onChange={(value) => update('allergies', value)} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Family history" placeholder="e.g. Hypertension on father's side" value={form.familyHistory} onChange={(value) => update('familyHistory', value)} multiline />
                <Field label="Medication history" placeholder="e.g. Metformin 500mg" value={form.medicationHistory} onChange={(value) => update('medicationHistory', value)} multiline />
              </div>

              <div className="rounded-2xl border border-gray-100 bg-[#F8F9FE]/60 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <UserGroupIcon className="h-4 w-4 text-[#6183FF]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                    Emergency contact
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    value={form.emergencyName}
                    onChange={(event) => update('emergencyName', event.target.value)}
                    placeholder="Full name"
                    className={inputClass}
                  />
                  <input
                    value={form.emergencyRelation}
                    onChange={(event) => update('emergencyRelation', event.target.value)}
                    placeholder="Relationship"
                    className={inputClass}
                  />
                  <input
                    value={form.emergencyPhone}
                    onChange={(event) => update('emergencyPhone', event.target.value)}
                    placeholder="Phone number"
                    inputMode="tel"
                    className={`${inputClass} sm:col-span-2`}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#6183FF] px-5 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-all hover:bg-[#4D6ED6] active:scale-[0.99] disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving fields...
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="h-4 w-4" />
                    Save health profile
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <input
                ref={cameraRef}
>>>>>>> 908a1e70 (Version 1.3)
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
<<<<<<< HEAD
                  if (file) void handleFile(file, 'camera');
=======
                  if (file) void handleFile(file);
>>>>>>> 908a1e70 (Version 1.3)
                  event.target.value = '';
                }}
              />
              <input
<<<<<<< HEAD
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file, 'upload');
=======
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
>>>>>>> 908a1e70 (Version 1.3)
                  event.target.value = '';
                }}
              />

<<<<<<< HEAD
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
=======
              {!selectedFile ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-[#6183FF]/40 bg-[#6183FF]/5 p-5 text-[#6183FF] transition-colors hover:bg-[#6183FF]/10"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <CameraIcon className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-bold">Take a photo</span>
                    <span className="text-[11px] font-medium text-[#6183FF]/70">
                      Uses your camera on mobile
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-gray-200 bg-[#F8F9FE] p-5 text-gray-600 transition-colors hover:border-[#6183FF]/30 hover:text-[#6183FF]"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#6183FF] shadow-sm">
                      <ArrowUpTrayIcon className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-bold">Choose a file</span>
                    <span className="text-[11px] font-medium text-gray-400">
                      Image, PDF, Word, or text
                    </span>
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-[#F8F9FE]">
                  <div className="relative">
                    {isImage && previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Document preview"
                        className="max-h-[220px] w-full object-contain"
                      />
                    ) : (
                      <div className="flex min-h-[120px] items-center justify-center gap-3 text-sm font-bold text-gray-500">
                        <DocumentTextIcon className="h-7 w-7 text-[#6183FF]" />
                        <span className="max-w-[220px] break-all">{selectedFile.name}</span>
>>>>>>> 908a1e70 (Version 1.3)
                      </div>
                    )}
                    <button
                      type="button"
<<<<<<< HEAD
                      onClick={() => {
                        setImageDataUrl(null);
                        setFileName('');
                        setMimeType('');
                        setOcrText('');
                        setOcrState('idle');
                      }}
                      className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-bold text-white"
=======
                      onClick={clearFile}
                      className="absolute right-2 top-2 rounded-full bg-black/65 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur"
>>>>>>> 908a1e70 (Version 1.3)
                    >
                      Replace
                    </button>
                  </div>
<<<<<<< HEAD
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
=======

                  <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-white px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#101217]">{selectedFile.name}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                        {humanFileSize(selectedFile.size)}
                        {ocrState === 'running'
                          ? ` - reading text ${ocrProgress}%`
                          : ocrState === 'done'
                            ? ' - text extracted'
                            : ocrState === 'failed'
                              ? ' - text can be added manually'
                              : ''}
                      </p>
                    </div>
                    {ocrState === 'running' ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#6183FF]">
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        {ocrProgress}%
                      </span>
                    ) : isImage ? (
                      <button
                        type="button"
                        onClick={() => selectedFile && void runOcr(selectedFile)}
>>>>>>> 908a1e70 (Version 1.3)
                        className="shrink-0 text-[11px] font-bold text-[#6183FF] hover:underline"
                      >
                        {ocrState === 'done' ? 'Read again' : 'Read text'}
                      </button>
<<<<<<< HEAD
                    )}
=======
                    ) : null}
>>>>>>> 908a1e70 (Version 1.3)
                  </div>
                </div>
              )}

<<<<<<< HEAD
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Record title *
                </label>
=======
              {readingFile && (
                <p className="flex items-center gap-2 text-[11px] font-semibold text-gray-400">
                  <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                  Preparing your file...
                </p>
              )}

              {ocrState === 'running' && (
                <div className="rounded-2xl border border-[#6183FF]/15 bg-[#EEF2FF]/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[11px] font-bold text-[#6183FF]">
                      <SparklesIcon className="h-4 w-4" />
                      {ocrMessage || 'Reading document text'}
                    </span>
                    <span className="text-[11px] font-black text-[#6183FF]">{ocrProgress}%</span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-[#6183FF] transition-all duration-300"
                      style={{ width: `${Math.max(4, Math.min(100, ocrProgress))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-medium leading-relaxed text-gray-500">
                    You can keep filling the form or save now. The extracted text will be added
                    when it is ready.
                  </p>
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                  Record name
                </span>
>>>>>>> 908a1e70 (Version 1.3)
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Full blood count, March 2026"
<<<<<<< HEAD
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
=======
                  className={inputClass}
                />
              </label>

              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                  Document type
                </p>
                <div className="flex flex-wrap gap-2">
                  {RECORD_CATEGORIES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={`min-h-[36px] rounded-full border px-3.5 text-[11px] font-bold transition-all ${
                        category === item
                          ? 'border-[#6183FF] bg-[#6183FF]/10 text-[#6183FF]'
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                    <SparklesIcon className="h-3.5 w-3.5 text-[#6183FF]" />
                    Extracted text
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const corrected = correctOcrText(ocrText);
                      setOcrText(corrected);
                      info('Text cleaned up. Review it before saving.');
                    }}
                    disabled={!ocrText.trim()}
                    className="text-[10px] font-bold text-[#6183FF] hover:underline disabled:opacity-40"
                  >
                    Auto-correct
                  </button>
>>>>>>> 908a1e70 (Version 1.3)
                </div>
                <textarea
                  value={ocrText}
                  onChange={(event) => setOcrText(event.target.value)}
<<<<<<< HEAD
                  rows={4}
                  placeholder="Text from the document appears here. You can correct it before saving."
                  className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-base leading-relaxed text-gray-700 outline-none focus:border-[#6183FF]"
                />
                {ocrMessage && (
                  <p className={`mt-1.5 text-[11px] font-medium ${ocrState === 'failed' ? 'text-amber-600' : 'text-gray-400'}`}>
=======
                  rows={5}
                  placeholder="Text from the document appears here. Correct anything that looks wrong before saving."
                  className="w-full resize-y rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 text-sm font-medium leading-relaxed text-gray-700 outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF] focus:bg-white"
                />
                {ocrMessage && (
                  <p
                    className={`mt-1.5 text-[11px] font-medium leading-relaxed ${
                      ocrState === 'failed' ? 'text-amber-600' : 'text-gray-400'
                    }`}
                  >
>>>>>>> 908a1e70 (Version 1.3)
                    {ocrMessage}
                  </p>
                )}
              </div>

<<<<<<< HEAD
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Notes
                </label>
=======
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                  Notes
                </span>
>>>>>>> 908a1e70 (Version 1.3)
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
<<<<<<< HEAD
                  placeholder="Anything your doctor should know about this record."
                  className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-base leading-relaxed text-gray-700 outline-none focus:border-[#6183FF]"
                />
              </div>

              <div className="rounded-2xl bg-[#F8F9FE] px-4 py-3 text-[11px] font-medium leading-relaxed text-gray-500">
                {online
                  ? 'Your image and extracted text are stored together. The image is the original; the text makes it searchable.'
                  : 'You are offline. This record is saved on this device and syncs automatically when the connection returns.'}
=======
                  placeholder="Anything a clinician should know about this record."
                  className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 text-sm font-medium leading-relaxed text-gray-700 outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF] focus:bg-white"
                />
              </label>

              <div className="flex items-start gap-2 rounded-2xl border border-[#6183FF]/10 bg-[#EEF2FF]/60 px-4 py-3">
                <IdentificationIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#6183FF]" />
                <p className="text-[11px] font-medium leading-relaxed text-gray-500">
                  Your image is stored as the original record. Extracted text makes it searchable,
                  and you can edit or clear it before saving.
                  {ocrState === 'running' && ' You can save now without waiting for the text.'}
                </p>
>>>>>>> 908a1e70 (Version 1.3)
              </div>

              <button
                type="button"
<<<<<<< HEAD
                onClick={handleSaveRecord}
                disabled={saving || ocrState === 'running'}
                className="w-full rounded-2xl bg-[#6183FF] py-4 text-base font-bold text-white transition-all hover:bg-[#4E6EEF] disabled:opacity-50"
              >
                {saving ? 'Saving record...' : ocrState === 'running' ? 'Reading document...' : 'Save record'}
              </button>
            </div>
=======
                onClick={saveRecord}
                disabled={saving || readingFile}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#6183FF] px-5 text-sm font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-all hover:bg-[#4D6ED6] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving record...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Confirm and save record
                  </>
                )}
              </button>
            </>
>>>>>>> 908a1e70 (Version 1.3)
          )}
        </div>
      </div>
    </div>
  );
}
<<<<<<< HEAD
=======

function Field({
  label,
  value,
  placeholder,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3 text-sm font-semibold text-gray-700 outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF] focus:bg-white"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-[46px] w-full rounded-xl border border-gray-100 bg-gray-50 px-3.5 text-sm font-semibold text-gray-700 outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF] focus:bg-white"
        />
      )}
    </label>
  );
}
>>>>>>> 908a1e70 (Version 1.3)
