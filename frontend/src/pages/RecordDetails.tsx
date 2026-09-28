import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '../lib/supabase/client';
import { useToast } from '../contexts/ToastContext';
import {
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  ShareIcon,
  TrashIcon,
  PencilIcon,
  ShieldCheckIcon,
  PrinterIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function RecordDetails() {
  const { success: toastSuccess, info, error: toastError } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRecordData = async () => {
      try {
        // 1. Prefer real auth user + patient_profiles (onboarding data)
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('patient_profiles')
            .select('id, full_name, date_of_birth, blood_group, genotype, phone, nin')
            .eq('user_id', user.id)
            .maybeSingle();

          const meta = user.user_metadata || {};
          const fullName =
            profile?.full_name ||
            [meta.first_name, meta.last_name].filter(Boolean).join(' ') ||
            user.email ||
            'Patient';

          setPatient({
            id: profile?.id || user.id,
            full_name: fullName,
            first_name: meta.first_name || fullName.split(' ')[0] || '',
            last_name: meta.last_name || fullName.split(' ').slice(1).join(' ') || '',
            date_of_birth: profile?.date_of_birth || null,
            email: user.email,
            blood_group: profile?.blood_group,
            genotype: profile?.genotype,
            phone: profile?.phone,
            nin: profile?.nin,
          });
        } else {
          // Fallback: localStorage from signup/onboarding
          const saved = localStorage.getItem('selorah_user');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setPatient({
                ...parsed,
                full_name:
                  parsed.full_name ||
                  [parsed.first_name, parsed.last_name].filter(Boolean).join(' ') ||
                  'Patient',
              });
            } catch {
              /* ignore */
            }
          }
        }

        // 2. Load record (skip mock hc* ids)
        if (id && id.startsWith('hc')) {
          setLoading(false);
          return;
        }

        if (id) {
          const { data, error } = await supabase
            .from('medical_records')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            console.error('Failed to fetch record:', error);
          } else if (data) {
            // Normalize DB columns → UI fields
            setRecord({
              ...data,
              name: data.title || data.name || 'Uploaded Document',
              title: data.title || data.name || 'Uploaded Document',
              date: data.created_at || data.date || null,
              created_at: data.created_at || data.date || null,
              document_url: data.file_url || data.document_url || null,
              file_url: data.file_url || data.document_url || null,
              record_type: data.record_type || 'Uploaded Document',
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordData();
  }, [id]);

  const isMockRecord = Boolean(id?.startsWith('hc')) || !record;

  const formatDate = (value: any) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const patientDisplayName =
    patient?.full_name ||
    [patient?.first_name, patient?.last_name].filter(Boolean).join(' ') ||
    'Patient';

  const patientIdLabel = patient?.id
    ? `SEL-${String(patient.id).replace(/-/g, '').substring(0, 6).toUpperCase()}`
    : id
      ? `SEL-${String(id).substring(0, 6).toUpperCase()}`
      : 'SEL-————';

  const handleUpdate = () => {
    setShowMenu(false);
    info('Record editor opens here (demo).');
  };

  const handleShare = () => {
    setShowMenu(false);
    if (
      window.confirm(
        'Do you want to share this record with your verified doctor? This will grant them temporary access.'
      )
    ) {
      toastSuccess('Record shared. Revoke access anytime in Access Log.');
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (
      window.confirm(
        'Are you sure you want to permanently delete this record? This action cannot be undone.'
      )
    ) {
      if (!isMockRecord && id) {
        await supabase.from('medical_records').delete().eq('id', id);
      }
      toastSuccess('Record deleted.');
      navigate('/dashboard/records');
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center text-gray-400">Loading record details...</div>
    );
  }

  const fileUrl = record?.file_url || record?.document_url || null;
  const isImage =
    !!fileUrl &&
    (fileUrl.startsWith('data:image') ||
      /\.(jpeg|jpg|gif|png|webp|svg)(\?|$)/i.test(fileUrl));

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/dashboard/records')}
          className="flex items-center gap-2 text-gray-400 hover:text-[#6183FF] transition-all group"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="font-bold text-sm">Back to Records</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#6183FF] hover:border-[#6183FF]/30 transition-all shadow-sm"
            title="Print"
          >
            <PrinterIcon className="w-5 h-5" />
          </button>
          <button
            className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#6183FF] hover:border-[#6183FF]/30 transition-all shadow-sm"
            title="Download PDF"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-3 rounded-xl transition-all ${
                showMenu
                  ? 'bg-[#6183FF] text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50'
              }`}
            >
              <EllipsisVerticalIcon className="w-6 h-6" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-4 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2">
                  <button
                    onClick={handleUpdate}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-400" /> Edit Record
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#6183FF] hover:bg-[#EEF2FF] rounded-xl transition-all"
                  >
                    <ShareIcon className="w-4 h-4" /> Share with Specialist
                  </button>
                  <div className="h-px bg-gray-50 my-2"></div>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <TrashIcon className="w-4 h-4" /> Permanent Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EMR Content */}
      <div className="bg-white rounded-[40px] border border-gray-50 shadow-xl shadow-blue-500/5 overflow-hidden">
        {/* EMR Header */}
        <div className="bg-[#0A0B14] p-10 text-white relative">
          <div className="absolute top-0 right-0 w-64 h-full bg-[#6183FF]/10 blur-3xl rounded-full -mr-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/10 rounded-[28px] flex items-center justify-center p-4 backdrop-blur-md border border-white/10">
                <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight mb-1">Selorah Health</h1>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
                  Verified Medical Record
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">
                    Patient ID
                  </p>
                  <p className="font-bold text-sm">{patientIdLabel}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">
                    DOB / Age
                  </p>
                  <p className="font-bold text-sm">{formatDate(patient?.date_of_birth)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">
                    Patient Name
                  </p>
                  <p className="font-bold text-base">{patientDisplayName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EMR Body */}
        <div className="p-10 md:p-14 space-y-12">
          {isMockRecord ? (
            <>
              {/* Clinical Context — demo mock */}
              <div className="grid md:grid-cols-3 gap-8 pb-10 border-b border-gray-50">
                <div>
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">
                    Facility
                  </h4>
                  <p className="font-bold text-[#101217]">St. Nicholas Hospital</p>
                  <p className="text-xs text-gray-400 font-medium mt-1">Lagos Island, Nigeria</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">
                    Ordering Physician
                  </h4>
                  <p className="font-bold text-[#101217]">Dr. Adeyemi O. (HCP-992)</p>
                  <p className="text-xs text-gray-400 font-medium mt-1">Consultant Hematologist</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">
                    Date of Service
                  </h4>
                  <p className="font-bold text-[#101217]">April 15, 2026</p>
                  <p className="text-xs text-gray-400 font-medium mt-1">Collected at 08:30 AM</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-[#101217] tracking-tight">
                    Laboratory Analysis
                  </h3>
                  <span className="bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-green-100 flex items-center gap-1.5">
                    <ShieldCheckIcon className="w-3 h-3" /> Fully Verified
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                          Test Description
                        </th>
                        <th className="pb-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                          Result
                        </th>
                        <th className="pb-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                          Units
                        </th>
                        <th className="pb-4 text-[10px] font-black text-gray-300 uppercase tracking-widest text-right">
                          Reference Range
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        { name: 'Hemoglobin (Hb)', result: '14.2', unit: 'g/dL', range: '13.5 - 17.5' },
                        {
                          name: 'White Blood Cells (WBC)',
                          result: '6.4',
                          unit: 'x10³/μL',
                          range: '4.5 - 11.0',
                        },
                        {
                          name: 'Platelet Count',
                          result: '245',
                          unit: 'x10³/μL',
                          range: '150 - 450',
                        },
                        {
                          name: 'Fasting Blood Sugar',
                          result: '92',
                          unit: 'mg/dL',
                          range: '70 - 99',
                          highlight: true,
                        },
                      ].map((test, i) => (
                        <tr key={i} className="group">
                          <td className="py-5 font-bold text-[#101217] text-sm">{test.name}</td>
                          <td
                            className={`py-5 font-black text-sm ${
                              test.highlight ? 'text-[#6183FF]' : 'text-[#101217]'
                            }`}
                          >
                            {test.result}
                          </td>
                          <td className="py-5 font-medium text-gray-400 text-sm">{test.unit}</td>
                          <td className="py-5 font-bold text-gray-400 text-sm text-right">
                            {test.range}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#F8F9FE] rounded-3xl p-8 border border-gray-100">
                <h3 className="text-sm font-black text-[#101217] uppercase tracking-widest mb-4">
                  Clinical Impressions
                </h3>
                <p className="text-gray-600 font-medium leading-relaxed italic">
                  &quot;Patient presents with stable metabolic profile. All hematological markers are
                  within normal limits. Fasting blood sugar is optimal. No clinical intervention
                  required at this stage. Recommend annual follow-up.&quot;
                </p>
              </div>

              <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-end gap-8">
                <div className="max-w-xs">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-6">
                    Digital Verification Stamp
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#EEF2FF] rounded-2xl flex items-center justify-center p-3">
                      <ShieldCheckIcon className="w-full h-full text-[#6183FF]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-[#101217] leading-tight mb-1">
                        ST. NICHOLAS HOSPITAL
                      </p>
                      <p className="text-[10px] font-bold text-gray-400">Blockchain Hash ID:</p>
                      <p className="text-[9px] font-mono text-[#6183FF] break-all uppercase">
                        0x8a2f...3b1d9c2e
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-12 flex items-end justify-end mb-2">
                    <span className="font-serif italic text-2xl text-[#050038] opacity-60">
                      Dr. Adeyemi
                    </span>
                  </div>
                  <div className="w-48 h-0.5 bg-gray-100 ml-auto"></div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">
                    Authorized Signatory
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Real Uploaded Record View */}
              <div className="grid md:grid-cols-3 gap-8 pb-10 border-b border-gray-50">
                <div>
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">
                    Record Name
                  </h4>
                  <p className="font-bold text-[#101217] text-lg">
                    {record.name || record.title || 'Uploaded Document'}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">
                    Record Type
                  </h4>
                  <p className="font-bold text-[#101217]">
                    {record.record_type || 'Uploaded Document'}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">
                    Upload Date
                  </h4>
                  <p className="font-bold text-[#101217]">
                    {formatDate(record.created_at || record.date)}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-[#101217] tracking-tight">
                    Attached Document
                  </h3>
                </div>

                {fileUrl ? (
                  <div className="bg-gray-50 rounded-2xl p-4 flex justify-center border border-gray-100 overflow-hidden">
                    {isImage ? (
                      <img
                        src={fileUrl}
                        alt={record.name || record.title || 'Document'}
                        className="max-w-full rounded-xl object-contain"
                        style={{ maxHeight: '600px' }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-center">
                        <DocumentArrowDownIcon className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-bold mb-4">
                          Document available for download
                        </p>
                        <a
                          href={fileUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#6183FF] text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-blue-500/20 hover:opacity-90"
                        >
                          Download Document
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No document attached to this record.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
