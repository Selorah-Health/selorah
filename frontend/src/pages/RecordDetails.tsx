import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  EllipsisVerticalIcon,
  LockClosedIcon,
  PencilIcon,
  PrinterIcon,
  QrCodeIcon,
  ShareIcon,
  ShieldCheckIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';
import { FILE_CATEGORY_TO_TYPE, formatRecordDate, RECORD_CATEGORIES } from '../lib/records';

type RecordRow = {
  id: string;
  title: string | null;
  name?: string | null;
  record_type: string | null;
  status: string | null;
  file_url: string | null;
  document_url?: string | null;
  created_at: string | null;
  date?: string | null;
};

type PatientSummary = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  blood_group: string | null;
  genotype: string | null;
  phone: string | null;
};

function decodeTextDataUrl(value: string) {
  if (!value.startsWith('data:text/plain')) return null;
  const commaIndex = value.indexOf(',');
  if (commaIndex === -1) return null;
  try {
    return decodeURIComponent(value.slice(commaIndex + 1));
  } catch {
    return null;
  }
}

function isImageUrl(value: string) {
  return (
    value.startsWith('data:image') ||
    /\.(jpeg|jpg|gif|png|webp|svg|avif)(\?|$)/i.test(value)
  );
}

function isPdfUrl(value: string) {
  return value.startsWith('data:application/pdf') || /\.pdf(\?|$)/i.test(value);
}

export default function RecordDetails() {
  const { success: toastSuccess, error: toastError } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const supabase = createClient();

  const [record, setRecord] = useState<RecordRow | null>(null);
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ title: '', recordType: RECORD_CATEGORIES[0] });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('patient_profiles')
          .select('id, full_name, date_of_birth, blood_group, genotype, phone')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          setPatient({
            id: profile.id,
            full_name:
              profile.full_name ||
              [user.user_metadata?.first_name, user.user_metadata?.last_name]
                .filter(Boolean)
                .join(' ') ||
              user.email ||
              'Patient',
            date_of_birth: profile.date_of_birth || null,
            blood_group: profile.blood_group || null,
            genotype: profile.genotype || null,
            phone: profile.phone || null,
          });
        } else {
          setPatient({
            id: user.id,
            full_name:
              [user.user_metadata?.first_name, user.user_metadata?.last_name]
                .filter(Boolean)
                .join(' ') ||
              user.email ||
              'Patient',
            date_of_birth: null,
            blood_group: null,
            genotype: null,
            phone: null,
          });
        }
      }

      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setRecord(null);
        return;
      }

      const row: RecordRow = {
        id: String(data.id),
        title: data.title || data.name || 'Untitled document',
        record_type: data.record_type || 'Clinical Document',
        status: data.status || null,
        file_url: data.file_url || data.document_url || null,
        created_at: data.created_at || data.date || null,
      };

      setRecord(row);
      setForm({
        title: row.title || '',
        recordType: row.record_type || RECORD_CATEGORIES[0],
      });
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'Could not load this record. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fileUrl = record?.file_url || null;
  const textContent = useMemo(() => (fileUrl ? decodeTextDataUrl(fileUrl) : null), [fileUrl]);
  const imagePreview = fileUrl && !textContent ? isImageUrl(fileUrl) : false;
  const pdfPreview = fileUrl && !textContent ? isPdfUrl(fileUrl) : false;

  const patientDisplayName = patient?.full_name || 'Patient';
  const patientIdLabel = patient?.id
    ? `SEL-${String(patient.id).replace(/-/g, '').substring(0, 6).toUpperCase()}`
    : 'Not assigned';

  const handleDownload = () => {
    if (!fileUrl) return;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = record?.title || 'selorah-record';
    link.rel = 'noreferrer';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleShare = () => {
    setShowMenu(false);
    toastSuccess('Generate a time-limited code on the next screen to share your records.');
    navigate('/dashboard/qrcodes');
  };

  const handleSaveEdit = async () => {
    if (!record) return;
    if (!form.title.trim()) {
      setErrorMsg('Give this record a name before saving.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('medical_records')
        .update({
          title: form.title.trim(),
          record_type: form.recordType,
        })
        .eq('id', record.id);

      if (error) throw error;

      setRecord((current) =>
        current
          ? {
              ...current,
              title: form.title.trim(),
              record_type: form.recordType,
            }
          : current
      );
      setShowEdit(false);
      setShowMenu(false);
      toastSuccess('Record details updated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update this record.';
      setErrorMsg(message);
      toastError(message, 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    const confirmed = window.confirm(
      'Permanently delete this record? This cannot be undone.'
    );
    if (!confirmed) return;

    setDeleting(true);
    setShowMenu(false);

    try {
      const { error } = await supabase.from('medical_records').delete().eq('id', record.id);
      if (error) throw error;
      toastSuccess('Record deleted.');
      navigate('/dashboard/records');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete this record.';
      setErrorMsg(message);
      toastError(message, 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 font-sora">
        <div className="h-5 w-32 animate-pulse rounded-full bg-gray-100" />
        <div className="h-[420px] animate-pulse rounded-[32px] bg-white" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="rounded-[32px] border border-gray-50 bg-white p-10 text-center font-sora shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#6183FF]">
          <LockClosedIcon className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-[#101217]">
          Record not found
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-gray-400">
          This record may have been deleted, or it does not belong to your account.
        </p>
        {errorMsg && (
          <p className="mx-auto mt-2 max-w-sm text-xs font-semibold text-red-500">{errorMsg}</p>
        )}
        <button
          type="button"
          onClick={() => navigate('/dashboard/records')}
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#6183FF] px-5 text-xs font-bold text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to records
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sora">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard/records')}
          className="group flex items-center gap-2 text-xs font-bold text-gray-400 transition-colors hover:text-[#6183FF]"
        >
          <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to records
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!fileUrl}
            title={fileUrl ? 'Download document' : 'No document attached'}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 shadow-sm transition-colors hover:border-[#6183FF]/30 hover:text-[#6183FF] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            title="Print"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 shadow-sm transition-colors hover:border-[#6183FF]/30 hover:text-[#6183FF]"
          >
            <PrinterIcon className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((value) => !value)}
              aria-expanded={showMenu}
              aria-label="Record actions"
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                showMenu
                  ? 'bg-[#6183FF] text-white shadow-lg shadow-[#6183FF]/20'
                  : 'border border-gray-100 bg-white text-gray-400 hover:bg-gray-50'
              }`}
            >
              <EllipsisVerticalIcon className="h-6 w-6" />
            </button>

            {showMenu && (
              <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowEdit(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <PencilIcon className="h-4 w-4 text-gray-400" />
                    Edit details
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[#6183FF] transition-colors hover:bg-[#EEF2FF]"
                  >
                    <ShareIcon className="h-4 w-4" />
                    Share with a clinician
                  </button>
                  <div className="my-2 h-px bg-gray-50" />
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {deleting ? 'Deleting...' : 'Delete record'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-red-600"
        >
          {errorMsg}
        </div>
      )}

      <div className="overflow-hidden rounded-[32px] border border-gray-50 bg-white shadow-xl shadow-blue-500/5">
        <div className="relative bg-[#0A0B14] p-6 text-white sm:p-9">
          <div
            aria-hidden
            className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-[#6183FF]/20 blur-3xl"
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                <img src="/logo.svg" alt="" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Selorah Health</h1>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/40">
                  Patient owned medical record
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <p className="mb-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/30">
                    Patient ID
                  </p>
                  <p className="text-sm font-bold">{patientIdLabel}</p>
                </div>
                <div>
                  <p className="mb-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/30">
                    Date of birth
                  </p>
                  <p className="text-sm font-bold">
                    {patient?.date_of_birth ? formatRecordDate(patient.date_of_birth) : 'Not recorded'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="mb-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/30">
                    Patient name
                  </p>
                  <p className="text-base font-bold">{patientDisplayName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10 p-6 sm:p-10">
          <div className="grid gap-6 border-b border-gray-50 pb-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-300">
                Record name
              </p>
              <p className="break-words text-base font-bold text-[#101217]">{record.title}</p>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-300">
                Document type
              </p>
              <p className="font-bold text-[#101217]">{record.record_type}</p>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-300">
                Uploaded
              </p>
              <p className="font-bold text-[#101217]">{formatRecordDate(record.created_at)}</p>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-300">
                Status
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-green-600">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                {record.status === 'active' || record.status === 'Active'
                  ? 'Encrypted'
                  : record.status || 'Private'}
              </span>
            </div>
          </div>

          {(patient?.blood_group || patient?.genotype || patient?.phone) && (
            <div className="grid gap-4 rounded-2xl bg-[#F8F9FE] p-5 sm:grid-cols-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Blood group
                </p>
                <p className="mt-1 text-sm font-bold text-[#101217]">
                  {patient?.blood_group || 'Not recorded'}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Genotype
                </p>
                <p className="mt-1 text-sm font-bold text-[#101217]">
                  {patient?.genotype || 'Not recorded'}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Phone
                </p>
                <p className="mt-1 text-sm font-bold text-[#101217]">
                  {patient?.phone || 'Not recorded'}
                </p>
              </div>
            </div>
          )}

          <div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight text-[#101217]">
                {textContent ? 'Record details' : 'Attached document'}
              </h2>
              {fileUrl && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-gray-200 px-3.5 text-[11px] font-bold text-gray-500 transition-colors hover:border-[#6183FF]/40 hover:text-[#6183FF]"
                >
                  <DocumentArrowDownIcon className="h-3.5 w-3.5" />
                  Download
                </button>
              )}
            </div>

            {!fileUrl ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FE] px-5 py-10 text-center">
                <LockClosedIcon className="mx-auto h-7 w-7 text-gray-300" />
                <p className="mt-3 text-sm font-bold text-[#101217]">No document attached</p>
                <p className="mx-auto mt-1 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
                  This entry only holds the details above. Add a file from the records page if you
                  need the original document.
                </p>
              </div>
            ) : textContent ? (
              <div className="whitespace-pre-wrap break-words rounded-2xl border border-gray-100 bg-[#F8F9FE] p-5 text-sm font-medium leading-relaxed text-gray-700">
                {textContent}
              </div>
            ) : imagePreview ? (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <img
                  src={fileUrl}
                  alt={record.title || 'Attached document'}
                  className="mx-auto max-h-[600px] w-auto max-w-full rounded-xl object-contain"
                />
              </div>
            ) : pdfPreview ? (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                <iframe
                  src={fileUrl}
                  title={record.title || 'Attached document'}
                  className="h-[600px] w-full"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#F8F9FE] px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#6183FF] shadow-sm">
                  <DocumentArrowDownIcon className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-bold text-[#101217]">
                  This document cannot be previewed
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
                  Download it to view the file on your device.
                </p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#6183FF] px-4 text-xs font-bold text-white"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Download document
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-50 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-[11px] font-semibold text-gray-400">
              <ShieldCheckIcon className="h-4 w-4 text-[#5FFAB0]" />
              Encrypted in transit and at rest. Only you decide who sees it.
            </p>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-full bg-[#EEF2FF] px-4 text-[11px] font-bold text-[#6183FF] transition-colors hover:bg-[#6183FF]/15"
            >
              <QrCodeIcon className="h-4 w-4" />
              Share with a code
            </button>
          </div>
        </div>
      </div>

      {showEdit && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-[#05081A]/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-record-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setShowEdit(false);
          }}
        >
          <div className="w-full max-w-md rounded-t-[28px] border border-gray-100 bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="edit-record-title" className="text-lg font-bold tracking-tight text-[#101217]">
                  Edit record details
                </h2>
                <p className="mt-1 text-xs font-medium text-gray-400">
                  Rename the document or correct its type.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                aria-label="Close edit record"
                disabled={saving}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Record name
                </span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors placeholder:font-medium placeholder:text-gray-300 focus:border-[#6183FF]"
                  placeholder="e.g. Full blood count"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">
                  Document type
                </span>
                <select
                  value={form.recordType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, recordType: event.target.value }))
                  }
                  className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#101217] outline-none transition-colors focus:border-[#6183FF]"
                >
                  {Object.values(FILE_CATEGORY_TO_TYPE).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                  {!Object.values(FILE_CATEGORY_TO_TYPE).includes(form.recordType) && (
                    <option value={form.recordType}>{form.recordType}</option>
                  )}
                </select>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                disabled={saving}
                className="min-h-[48px] flex-1 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex min-h-[48px] flex-[2] items-center justify-center gap-2 rounded-2xl bg-[#6183FF] text-xs font-bold text-white shadow-lg shadow-[#6183FF]/20 transition-colors hover:bg-[#4D6ED6] disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
