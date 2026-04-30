import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TrashIcon
} from '@heroicons/react/24/outline';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: '',
    firstName: '',
    lastName: '',
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
    otpSent: false,
    otpVerified: false
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleFinish = () => {
    navigate('/dashboard');
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
    { id: 'provider', title: 'Provider', desc: 'Access and update patient medical records securely.', icon: BuildingOffice2Icon },
    { id: 'researcher', title: 'Researcher', desc: 'Analyze anonymized health data for clinical studies.', icon: BeakerIcon },
    { id: 'insurer', title: 'Insurer', desc: 'Verify health claims and manage policies efficiently.', icon: ShieldCheckIcon },
    { id: 'developer', title: 'Developer', desc: 'Build and integrate with the Selorah Health API.', icon: SparklesIcon },
    { id: 'partner', title: 'Partner', desc: 'Collaborate to build modern health tech solutions.', icon: CheckCircleIcon },
  ];

  const totalSteps = formData.role === 'patient' ? 5 : 4;

  return (
    <div className="min-h-screen bg-white text-[#050038] flex flex-col font-sora selection:bg-[#4262FF]/10">
      {/* Header Line */}
      <header className="w-full h-[70px] border-b border-gray-100 flex items-center px-12 shrink-0">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
          <img src="/logo.png" alt="Selorah Logo" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
          <span className="text-xl font-bold tracking-tight text-[#4262FF]">Selorah</span>
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto px-12 py-12 scrollbar-hide">
        <div className="w-full max-w-[850px] mx-auto">
          
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
                        setFormData({...formData, role: role.id});
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
                <button onClick={() => setStep(totalSteps)} className="text-[#676767] text-xs hover:text-[#050038] transition-colors font-medium">
                  I just want to <span className="text-[#4262ff] font-bold">try out the tool →</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Info (Patient) or KYC (Other) */}
          {step === 2 && (
            <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#050038] mb-1">{formData.role === 'patient' ? 'Registration' : 'KYC Verification'}</h1>
                <p className="text-gray-500 text-sm">{formData.role === 'patient' ? "Let's set up your secure health profile." : "Official documentation is required."}</p>
              </div>

              <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-blue-500/5">
                {formData.role === 'patient' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" placeholder="First Name"
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm text-[#050038] font-medium"
                        value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      />
                      <input 
                        type="text" placeholder="Last Name"
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm text-[#050038] font-medium"
                        value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                    <input 
                      type="date" className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm text-[#050038] font-medium"
                      value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    />
                    <div className="relative">
                      <input 
                        type="tel" placeholder="WhatsApp Number"
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm text-[#050038] font-medium"
                        value={formData.whatsappNumber} onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                      />
                      <PhoneIcon className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    </div>
                  </>
                ) : (
                  <>
                    <input 
                      type="text" placeholder="Organization Name"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm font-medium"
                      value={formData.orgName} onChange={(e) => setFormData({...formData, orgName: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" placeholder="License #"
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm font-medium"
                        value={formData.licenseNumber} onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                      />
                      <input 
                        type="text" placeholder="Tax ID"
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm font-medium"
                        value={formData.taxId} onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                      />
                    </div>
                    <input 
                      type="email" placeholder="Official Email"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm font-medium"
                      value={formData.officialEmail} onChange={(e) => setFormData({...formData, officialEmail: e.target.value})}
                    />
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={prevStep} className="flex-1 bg-white border border-gray-100 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-[#050038]">Back</button>
                <button 
                  onClick={nextStep} 
                  className="flex-[2] bg-[#4262FF] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  disabled={formData.role === 'patient' ? !formData.firstName : !formData.orgName}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Medical Info or Document Upload */}
          {step === 3 && (
            <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#050038] mb-1">{formData.role === 'patient' ? 'Emergency Info' : 'Upload Documents'}</h1>
                <p className="text-gray-500 text-sm">{formData.role === 'patient' ? "Critical information for first responders." : "Proof of identity and license."}</p>
              </div>

              {formData.role === 'patient' ? (
                <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="grid grid-cols-3 gap-3">
                    <input 
                      type="text" placeholder="H (cm)"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-3 py-3 focus:outline-none focus:border-[#4262FF] text-xs font-bold"
                      value={formData.vitals.height} onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, height: e.target.value}})}
                    />
                    <input 
                      type="text" placeholder="W (kg)"
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-3 py-3 focus:outline-none focus:border-[#4262FF] text-xs font-bold"
                      value={formData.vitals.weight} onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, weight: e.target.value}})}
                    />
                    <select 
                      className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-2 py-3 focus:outline-none focus:border-[#4262FF] text-xs font-bold"
                      value={formData.vitals.bloodType} onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, bloodType: e.target.value}})}
                    >
                      <option value="">Blood</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <textarea 
                    placeholder="Known Allergies"
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm font-medium min-h-[60px]"
                    value={formData.allergies} onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                  />
                  <textarea 
                    placeholder="Medical Conditions"
                    className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4262FF] text-sm font-medium min-h-[60px]"
                    value={formData.medicalConditions} onChange={(e) => setFormData({...formData, medicalConditions: e.target.value})}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {['Org ID', 'Medical License', 'Official ID'].map((doc) => (
                    <div key={doc} className="bg-gray-50/50 p-6 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-[#EEF2FF]/30 transition-all cursor-pointer">
                      <CloudArrowUpIcon className="w-6 h-6 text-gray-300" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{doc}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button onClick={prevStep} className="flex-1 bg-white border border-gray-100 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-[#050038]">Back</button>
                <button onClick={nextStep} className="flex-[2] bg-[#4262FF] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">Continue</button>
              </div>
            </div>
          )}

          {/* Step 4: Emergency Contacts (Patient) or Completion (Other) */}
          {step === 4 && (
            <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              {formData.role === 'patient' ? (
                <>
                  <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[#050038] mb-1">Emergency Contacts</h1>
                    <p className="text-gray-500 text-sm">Add up to 3 contacts for emergencies.</p>
                  </div>

                  <div className="space-y-3">
                    {formData.emergencyContacts.map((contact, index) => (
                      <div key={index} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative">
                        <button onClick={() => removeContact(index)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input 
                            type="text" placeholder="Name"
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4262FF] text-xs font-bold"
                            value={contact.name} onChange={(e) => updateContact(index, 'name', e.target.value)}
                          />
                          <input 
                            type="text" placeholder="Relation"
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4262FF] text-xs font-bold"
                            value={contact.relationship} onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                          />
                        </div>
                        <input 
                          type="tel" placeholder="Phone"
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-[#4262FF] text-xs font-bold"
                          value={contact.phone} onChange={(e) => updateContact(index, 'phone', e.target.value)}
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

                  <div className="flex gap-3 mt-8">
                    <button onClick={prevStep} className="flex-1 bg-white border border-gray-100 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-[#050038]">Back</button>
                    <button 
                      onClick={nextStep} 
                      className="flex-[2] bg-[#4262FF] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20"
                    >
                      Complete
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-[#F0F2FF] rounded-full mx-auto flex items-center justify-center mb-6 border-4 border-white shadow-xl shadow-blue-500/10">
                    <CheckCircleIcon className="w-10 h-10 text-[#4262FF]" />
                  </div>
                  <h1 className="text-3xl font-bold text-[#050038] mb-3">Verification Pending</h1>
                  <p className="text-gray-500 text-sm mb-10 leading-relaxed px-4">Our team is reviewing your documents. You can explore the dashboard in the meantime.</p>
                  <button onClick={handleFinish} className="w-full bg-[#4262FF] text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:opacity-90 transition-all">Go to Dashboard</button>
                </div>
              )}
            </div>
          )}

          {/* Final Step: Completion (Patient) */}
          {step === 5 && formData.role === 'patient' && (
            <div className="max-w-md mx-auto text-center py-10">
              <div className="w-20 h-20 bg-[#F0F2FF] rounded-full mx-auto flex items-center justify-center mb-6 border-4 border-white shadow-xl shadow-blue-500/10">
                <CheckCircleIcon className="w-10 h-10 text-[#4262FF]" />
              </div>
              <h1 className="text-3xl font-bold text-[#050038] mb-2 tracking-tight">Setup Complete!</h1>
              <p className="text-gray-500 text-sm mb-10">Welcome to Selorah Health, {formData.firstName}.</p>
              <button 
                onClick={handleFinish}
                className="w-full bg-[#4262FF] text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:opacity-90 transition-all"
              >
                Launch Dashboard
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
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i + 1 === step ? 'bg-[#4262FF] w-4' : 'bg-gray-100'}`}
          ></div>
        ))}
      </div>
    </div>
  );
}

function CloudArrowUpIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
  );
}


