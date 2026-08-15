import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserIcon,
  SparklesIcon,
  CheckCircleIcon,
  BuildingOffice2Icon,
  BeakerIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '../lib/supabase/client';
import { useRef } from 'react';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    role: '',
    firstName: '',
    lastName: '',
    nin: '',
    dateOfBirth: '',
    gender: '',
    whatsappNumber: '',
    vitals: { height: '', weight: '', bloodType: '' },
    allergies: '',
    medicalConditions: '',
    emergencyContacts: [] as EmergencyContact[],
    orgName: '',
    licenseNumber: '',
    taxId: '',
    officialEmail: '',
    officialPhone: '',
    uploadedDocs: {} as Record<string, boolean>,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadDoc, setCurrentUploadDoc] = useState<string | null>(null);

  // Prefill first/last name from signup (localStorage) and Supabase user metadata
  useEffect(() => {
    let cancelled = false;

    const prefill = async () => {
      let first = '';
      let last = '';

      try {
        const saved = localStorage.getItem('selorah_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          first = parsed.first_name || parsed.firstName || '';
          last = parsed.last_name || parsed.lastName || '';
        }
      } catch {
        // ignore bad localStorage
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata) {
          first = first || user.user_metadata.first_name || user.user_metadata.firstName || '';
          last = last || user.user_metadata.last_name || user.user_metadata.lastName || '';
        }
      } catch {
        // auth may be unavailable offline
      }

      let roleFromSignup = '';
      try {
        const saved = localStorage.getItem('selorah_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          roleFromSignup = parsed.role || '';
        }
      } catch { /* ignore */ }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.role) {
          roleFromSignup = roleFromSignup || user.user_metadata.role;
        }
      } catch { /* ignore */ }

      if (!cancelled) {
        setFormData((prev) => ({
          ...prev,
          firstName: prev.firstName || first,
          lastName: prev.lastName || last,
          role: prev.role || roleFromSignup || '',
        }));
        // Skip role selection if already chosen at signup
        if (roleFromSignup) {
          setStep(2);
        }
      }
    };

    prefill();
    return () => { cancelled = true; };
  }, []); // run once on mount

  const handleUploadClick = (docType: string) => {
    setCurrentUploadDoc(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUploadDoc) {
      // Simulate an upload or you could actually upload to Supabase storage here.
      // For now, we'll just mark it as uploaded in the UI.
      setFormData(prev => ({
        ...prev,
        uploadedDocs: {
          ...prev.uploadedDocs,
          [currentUploadDoc]: true
        }
      }));
      alert(`${currentUploadDoc} uploaded successfully!`);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCurrentUploadDoc(null);
  };

  const nextStep = () => {
    if (step === 2 && formData.role === 'patient') {
      if (!formData.nin || formData.nin.length !== 11) {
        setErrorMsg('Patients must provide a valid 11-digit NIN.');
        return;
      }
      setErrorMsg(null);
    }
    setStep(step + 1);
  };
  const prevStep = () => {
    // If role was chosen at signup, do not return to role picker
    let roleLocked = false;
    try {
      const s = localStorage.getItem('selorah_user');
      if (s && JSON.parse(s).role) roleLocked = true;
    } catch { /* ignore */ }
    if (step <= 2 && roleLocked) return;
    setStep(Math.max(1, step - 1));
  };

  const handleFinish = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If user exists, save to real schema tables
      if (user) {
        const role = formData.role === 'hospital' ? 'provider' : (formData.role || 'patient');

        await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
          role,
        });

        if (role === 'patient') {
          const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim();
          const payload = {
            user_id: user.id,
            full_name: fullName || null,
            date_of_birth: formData.dateOfBirth || null,
            phone: formData.whatsappNumber || null,
            nin: formData.nin || null,
            blood_group: formData.vitals?.bloodType || null,
          };
          const { data: existing } = await supabase
            .from('patient_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (existing) {
            const { error } = await supabase.from('patient_profiles').update(payload).eq('user_id', user.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('patient_profiles').insert(payload);
            if (error) throw error;
          }
        } else if (role === 'provider') {
          const orgId = `ORG-${user.id.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
          const payload = {
            user_id: user.id,
            hospital_name: formData.orgName || null,
            email: formData.officialEmail || user.email,
            phone: formData.whatsappNumber || null,
            org_id: orgId,
          };
          const { data: existing } = await supabase
            .from('hospital_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (existing) {
            const { error } = await supabase.from('hospital_profiles').update(payload).eq('user_id', user.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('hospital_profiles').insert(payload);
            if (error) throw error;
          }
        } else if (role === 'researcher') {
          const orgId = `RES-${user.id.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
          const payload = {
            user_id: user.id,
            full_name: [formData.firstName, formData.lastName].filter(Boolean).join(' ') || formData.orgName,
            institution: formData.orgName || null,
            org_id: orgId,
          };
          const { data: existing } = await supabase
            .from('researcher_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (existing) {
            const { error } = await supabase.from('researcher_profiles').update(payload).eq('user_id', user.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('researcher_profiles').insert(payload);
            if (error) throw error;
          }
        }
      } else {
        console.warn("No authenticated user found. Saving locally only.");
      }

      // Save user profile state locally as fallback
      const savedUserStr = localStorage.getItem('selorah_user');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : {};
      localStorage.setItem('selorah_user', JSON.stringify({
        ...savedUser,
        first_name: formData.firstName || formData.orgName,
        last_name: formData.lastName || '',
        role: formData.role,
        nin: formData.nin || (savedUser as any).nin,
        phone: formData.whatsappNumber || (savedUser as any).phone,
      }));

      if (formData.role === 'provider' || formData.role === 'hospital') {
        navigate('/hospital');
      } else if (formData.role === 'researcher') {
        navigate('/researcher');
      } else if (formData.role === 'insurer') {
        navigate('/insurer');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addContact = () => {
    if (formData.emergencyContacts.length < 3) {
      setFormData({
        ...formData,
        emergencyContacts: [...formData.emergencyContacts, { name: '', relationship: '', phone: '' }]
      });
    }
  };

  const removeContact = (index: number) => {
    setFormData({
      ...formData,
      emergencyContacts: formData.emergencyContacts.filter((_, i) => i !== index)
    });
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const newContacts = [...formData.emergencyContacts];
    newContacts[index][field] = value;
    setFormData({ ...formData, emergencyContacts: newContacts });
  };

  const roles = [
    { id: 'patient', title: 'Patient', desc: 'Manage your personal health records and history.', icon: UserIcon },
    { id: 'hospital', title: 'Hospital / Clinic', desc: 'Manage medical records for thousands of patients.', icon: BuildingOffice2Icon },
    { id: 'researcher', title: 'Researcher', desc: 'Analyze anonymized health data for clinical studies.', icon: BeakerIcon },
    { id: 'insurer', title: 'Insurer', desc: 'Verify health claims and manage policies efficiently.', icon: ShieldCheckIcon },
  ];

  const isPatient = formData.role === 'patient';
  const totalSteps = isPatient ? 5 : 4;

  return (
    <div className="min-h-screen bg-white text-[#050038] flex flex-col font-sora selection:bg-[#4262FF]/10">
      {/* Header */}
      <header className="w-full h-[70px] border-b border-gray-100 flex items-center px-12 shrink-0">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
          <img src="/logo.svg" alt="Selorah Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
          
          <span className="text-xl font-bold tracking-tight text-[#4262FF]">Selorah</span>
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-12 py-12 scrollbar-hide">
        <div className="w-full max-w-[850px] mx-auto">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10">
                <h1 className="text-2xl font-bold text-[#050038] mb-1 tracking-tight">What do you want to do?</h1>
                <p className="text-[#676767] text-sm">Choose the area you want to work in.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => {
                  const isSelected = formData.role === role.id;
                  return (
                    <div
                      key={role.id}
                      onClick={() => {
                        setFormData({ ...formData, role: role.id });
                        setTimeout(() => setStep(2), 400);
                      }}
                      className={`rounded-2xl p-5 h-[150px] flex flex-col cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#f0f0ff] border-2 border-[#4262ff]'
                          : 'bg-white border border-slate-100 hover:border-[#4262ff]/40 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-base text-[#050038] leading-tight">{role.title}</h3>
                        {isSelected && <ArrowRightIcon className="w-3 h-3 text-[#4262ff] stroke-[3]" />}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                        {role.desc}
                      </p>
                      <div className="mt-auto">
                        <role.icon className={`w-8 h-8 stroke-[1.5] ${isSelected ? 'text-[#4262ff]' : 'text-[#050038]'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-10">
                <button 
                  onClick={() => setStep(totalSteps)} 
                  className="text-[#676767] text-xs hover:text-[#050038] transition-colors font-medium"
                >
                  I just want to <span className="text-[#4262ff] font-bold">try out the tool →</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">{errorMsg}</div>
              )}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#050038] mb-1">
                  {isPatient ? 'Registration' : 'Institutional Setup'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {isPatient ? "Let's set up your secure health profile." : "Official organization details are required."}
                </p>
              </div>

              <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-blue-500/5">
                {isPatient ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="First Name"
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                    <input
                      type="date"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={11}
                        required
                        placeholder="NIN (11 digits) *"
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm"
                        value={formData.nin}
                        onChange={(e) => setFormData({ ...formData, nin: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                      />
                      <p className="text-[11px] text-gray-400 mt-1.5 px-1">Required for patients. Used to log in and for hospital lookup. You can update it later in Settings.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Organization Name"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm"
                      value={formData.orgName}
                      onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                    />
                    <input
                      type="email"
                      placeholder="Official Email"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm"
                      value={formData.officialEmail}
                      onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                    />
                  </>
                )}
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="WhatsApp Number"
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  />
                  <PhoneIcon className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={prevStep}
                  className="flex-1 bg-white border border-gray-100 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-[#050038]"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={isPatient ? !formData.firstName.trim() : !formData.orgName.trim()}
                  className="flex-[2] bg-[#4262FF] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Medical Info / Document Upload */}
          {step === 3 && (
            <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#050038] mb-1">
                  {isPatient ? 'Emergency Info' : 'Upload Documents'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {isPatient ? "Critical information for first responders." : "Proof of identity and license."}
                </p>
              </div>

              {isPatient ? (
                <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="H (cm)"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-3 py-3 focus:outline-none focus:border-[#4262FF] text-xs font-bold"
                      value={formData.vitals.height}
                      onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, height: e.target.value } })}
                    />
                    <input
                      type="text"
                      placeholder="W (kg)"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-3 py-3 focus:outline-none focus:border-[#4262FF] text-xs font-bold"
                      value={formData.vitals.weight}
                      onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, weight: e.target.value } })}
                    />
                    <select
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-2 py-3 focus:outline-none focus:border-[#4262FF] text-xs font-bold"
                      value={formData.vitals.bloodType}
                      onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, bloodType: e.target.value } })}
                    >
                      <option value="">Blood</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    placeholder="Known Allergies"
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm min-h-[60px]"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  />
                  <textarea
                    placeholder="Medical Conditions"
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm min-h-[60px]"
                    value={formData.medicalConditions}
                    onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {['Org ID', 'Medical License', 'Official ID'].map((doc) => {
                    const isUploaded = formData.uploadedDocs[doc];
                    return (
                      <div
                        key={doc}
                        onClick={() => handleUploadClick(doc)}
                        className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          isUploaded 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50/50 border-gray-100 hover:bg-[#EEF2FF]/30'
                        }`}
                      >
                        {isUploaded ? (
                          <>
                            <CheckCircleIcon className="w-6 h-6 text-green-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-green-600">{doc} Uploaded</p>
                          </>
                        ) : (
                          <>
                            <CloudArrowUpIcon className="w-6 h-6 text-gray-300" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Upload {doc}</p>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button onClick={prevStep} className="flex-1 bg-white border border-gray-100 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-[#050038]">
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="flex-[2] bg-[#4262FF] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Emergency Contacts (Patient) or Completion (Others) */}
          {step === 4 && (
            <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isPatient ? (
                <>
                  <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[#050038] mb-1">Emergency Contacts</h1>
                    <p className="text-gray-500 text-sm">Add up to 3 contacts for emergencies.</p>
                  </div>
                  <div className="space-y-3">
                    {formData.emergencyContacts.map((contact, index) => (
                      <div key={index} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative">
                        <button
                          onClick={() => removeContact(index)}
                          className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input
                            type="text"
                            placeholder="Name"
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4262FF] text-xs font-bold"
                            value={contact.name}
                            onChange={(e) => updateContact(index, 'name', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Relation"
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4262FF] text-xs font-bold"
                            value={contact.relationship}
                            onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                          />
                        </div>
                        <input
                          type="tel"
                          placeholder="Phone"
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4262FF] text-xs font-bold"
                          value={contact.phone}
                          onChange={(e) => updateContact(index, 'phone', e.target.value)}
                        />
                      </div>
                    ))}

                    {formData.emergencyContacts.length < 3 && (
                      <button
                        onClick={addContact}
                        className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                      >
                        <PlusIcon className="w-4 h-4" /> Add Contact
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-[#F0F2FF] rounded-full mx-auto flex items-center justify-center mb-6 border-4 border-white shadow-xl shadow-blue-500/10">
                    <CheckCircleIcon className="w-10 h-10 text-[#4262FF]" />
                  </div>
                  <h1 className="text-3xl font-bold text-[#050038] mb-3">Verification Pending</h1>
                  <p className="text-gray-500 text-sm mb-10 leading-relaxed px-4">
                    Our team is reviewing your documents. You can explore the dashboard in the meantime.
                  </p>
                  {errorMsg && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4">
                      {errorMsg}
                    </div>
                  )}
                  <button
                    onClick={handleFinish}
                    disabled={saving}
                    className="w-full bg-[#4262FF] text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving Profile...' : 'Go to Dashboard'}
                  </button>
                </div>
              )}

              {isPatient && (
                <div className="flex gap-3 mt-8">
                  <button onClick={prevStep} className="flex-1 bg-white border border-gray-100 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-[#050038]">
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    className="flex-[2] bg-[#4262FF] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20"
                  >
                    Complete
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Completion for Patients */}
          {step === 5 && isPatient && (
            <div className="max-w-md mx-auto text-center py-10">
              <div className="w-20 h-20 bg-[#F0F2FF] rounded-full mx-auto flex items-center justify-center mb-6 border-4 border-white shadow-xl shadow-blue-500/10">
                <CheckCircleIcon className="w-10 h-10 text-[#4262FF]" />
              </div>
              <h1 className="text-3xl font-bold text-[#050038] mb-2 tracking-tight">Setup Complete!</h1>
              <p className="text-gray-500 text-sm mb-10">
                Welcome to Selorah Health, {formData.firstName || 'User'}.
              </p>
              {errorMsg && (
                <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4">
                  {errorMsg}
                </div>
              )}
              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full bg-[#4262FF] text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving Profile...' : 'Launch Dashboard'}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Pagination Dots */}
      <div className="w-full py-8 flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i + 1 === step ? 'bg-[#4262FF] w-4' : 'bg-gray-100'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
