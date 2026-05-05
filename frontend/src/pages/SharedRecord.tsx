import { useParams } from 'react-router-dom';
import { 
  ShieldCheckIcon, 
  CalendarIcon, 
  IdentificationIcon, 
  BeakerIcon, 
  ClockIcon,
  UserIcon,
  HeartIcon,
  ScaleIcon,
  InformationCircleIcon,
  DocumentPlusIcon,
  XMarkIcon,
  ChevronRightIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function SharedRecord() {
  const { token } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationRole, setVerificationRole] = useState<'doctor' | 'nurse' | null>(null);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(true);
  const [showVisitReportModal, setShowVisitReportModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'lab' | 'rad' | 'pres'>('all');

  // Verification Logic
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (licenseNumber === 'SHQ123ADMIN') {
      setIsVerified(true);
      setShowVerificationModal(false);
    } else {
      alert('Invalid license number. For demo, use SHQ123ADMIN');
    }
  };

  useEffect(() => {
    // Mock patient data based on user request
    setPatient({
      first_name: 'John Olusegun',
      last_name: 'Doe',
      dob: 'Jan 15, 1990',
      age: 36,
      height: '182cm',
      weight: '78kg',
      bloodGroup: 'O+',
      genotype: 'AA',
      bloodSugar: '95 mg/dL',
      bloodPressure: '120/80 mmHg',
      spO2: '98%',
      allergies: ['Penicillin', 'Peanuts', 'Latex'],
      familyHistory: 'Father: Hypertension, Mother: Type 2 Diabetes',
      medicationHistory: 'Metformin 500mg (Daily), Aspirin 75mg (Daily)',
      immunization: ['BCG', 'Yellow Fever', 'COVID-19 (3 doses)', 'Hepatitis B'],
      emergencyContacts: [
        { name: 'Sarah Doe', relationship: 'Spouse', phone: '+234 801 234 5678' },
        { name: 'Dr. Michael Ade', relationship: 'Family Physician', phone: '+234 802 987 6543' }
      ]
    });

    if (token) {
      const parts = token.split('_');
      if (parts.length === 3) {
        const expiryMins = parts[1];
        const timestamp = parseInt(parts[2]);
        if (expiryMins !== 'none') {
          const totalSeconds = parseInt(expiryMins) * 60;
          const elapsedSeconds = Math.floor((Date.now() - timestamp) / 1000);
          const remaining = totalSeconds - elapsedSeconds;
          if (remaining <= 0) {
            setIsExpired(true);
            setTimeLeft(0);
          } else {
            setTimeLeft(remaining);
          }
        }
      }
    }

    // Log access if not verified (Simplified for demo)
    if (!isVerified) {
      const accessLog = JSON.parse(localStorage.getItem('selorah_access_log') || '[]');
      accessLog.push({
        id: Math.random().toString(36).substr(2, 9),
        device: navigator.userAgent.includes('iPhone') ? 'iPhone' : 'MacBook Pro',
        location: 'Lagos, Nigeria',
        timestamp: new Date().toISOString(),
        verified: false
      });
      localStorage.setItem('selorah_access_log', JSON.stringify(accessLog));
    }
  }, [token, isVerified]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const records = [
    { id: '1', title: 'Comprehensive Metabolic Panel', category: 'lab', facility: 'St. Nicholas Hospital', doctor: 'Dr. Chima', date: 'April 20, 2026', content: 'All values within normal range.' },
    { id: '2', title: 'Chest X-Ray (PA View)', category: 'rad', facility: 'Havana Specialist Hospital', doctor: 'Dr. Okoro', date: 'April 15, 2026', content: 'Clear lung fields. No cardiomegaly.' },
    { id: '3', title: 'Metformin Prescription', category: 'pres', facility: 'Lagos State General Hospital', doctor: 'Dr. Bello', date: 'March 28, 2026', content: 'Take one tablet twice daily with meals.' },
  ];

  const filteredRecords = activeCategory === 'all' ? records : records.filter(r => r.category === activeCategory);

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6 font-sora">
        <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-2xl border border-gray-100">
          <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
            <ClockIcon className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Access Expired</h2>
          <p className="text-gray-500 leading-relaxed mb-10">This secure link has reached its time limit. Please request a new one from the patient.</p>
          <button onClick={() => window.location.href = '/'} className="w-full bg-[#0A0B14] text-white py-5 rounded-2xl font-bold hover:bg-black transition-all">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sora py-8 md:py-16 px-4 selection:bg-primary/30">
      
      {/* Verification Gateway Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0B14]/80 backdrop-blur-md p-6">
          <div className="max-w-md w-full bg-white rounded-[40px] p-10 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-black tracking-tight text-[#0A0B14]">Selorah Secure</span>
            </div>
            
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-tight">Verification Required</h2>
            <p className="text-gray-500 mb-10 leading-relaxed font-medium">To view this patient's full medical history, please verify your credentials.</p>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex p-1 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setVerificationRole('doctor')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${verificationRole === 'doctor' ? 'bg-white text-[#4262ff] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Doctor
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationRole('nurse')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${verificationRole === 'nurse' ? 'bg-white text-[#4262ff] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Nurse
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">License Number</label>
                <input
                  type="text"
                  required
                  placeholder="Enter License No."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus:outline-none focus:border-[#4262ff] transition-all font-bold placeholder:text-gray-300"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 italic">For demo: SHQ123ADMIN</p>
              </div>

              <button
                type="submit"
                disabled={!verificationRole || !licenseNumber}
                className="w-full bg-[#4262ff] text-white py-5 rounded-2xl font-bold text-lg hover:bg-[#3252DF] transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Unlock Records
              </button>
              
              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="w-full text-gray-400 font-bold py-2 hover:text-gray-600 transition-colors"
              >
                View as Guest (Restricted)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Floating Header */}
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-6 rounded-[32px] flex items-center justify-between shadow-xl shadow-blue-500/5 sticky top-8 z-50">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
            <div className="hidden sm:block">
              <span className="font-black text-lg tracking-tight">Selorah Health</span>
              <p className="text-[10px] font-black uppercase text-[#4262ff] tracking-[0.2em] leading-none">Shared Access</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isVerified && (
              <button 
                onClick={() => setShowVisitReportModal(true)}
                className="bg-[#4262ff] text-white px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-[#3252DF] transition-all shadow-lg shadow-blue-500/20"
              >
                <DocumentPlusIcon className="w-4 h-4" />
                Add Visit Report
              </button>
            )}
            <div className="h-8 w-px bg-gray-100 mx-2 hidden sm:block"></div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Time Remaining</p>
              <p className={`font-bold text-sm ${timeLeft && timeLeft < 300 ? 'text-red-500' : 'text-gray-900'}`}>
                {timeLeft ? (Math.floor(timeLeft / 60) + 'm ' + (timeLeft % 60) + 's') : '∞'}
              </p>
            </div>
          </div>
        </div>

        {/* CV Style Patient History */}
        <div className="bg-white border border-gray-100 rounded-[48px] overflow-hidden shadow-2xl relative">
          {/* Top Banner */}
          <div className="h-32 bg-[#F0F2FF] relative">
            <div className="absolute -bottom-16 left-12">
              <div className="w-32 h-32 rounded-[40px] bg-white p-2 shadow-xl border border-gray-100">
                <div className="w-full h-full rounded-[32px] bg-gradient-to-tr from-[#6183FF] to-[#14F1D9] flex items-center justify-center font-black text-4xl text-white">
                  JD
                </div>
              </div>
            </div>
            {isVerified && (
              <div className="absolute top-6 right-12 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-[#4262ff]" />
                <span className="text-xs font-bold text-[#4262ff] uppercase tracking-widest">Verified {verificationRole}</span>
              </div>
            )}
          </div>

          <div className="pt-24 px-12 pb-16">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-gray-100 pb-12">
              <div>
                <h1 className="text-5xl font-black text-[#0A0B14] tracking-tighter mb-4">
                  {patient?.first_name} {patient?.last_name}
                </h1>
                <div className="flex flex-wrap gap-4">
                  <span className="bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> {patient?.dob} ({patient?.age}Y)
                  </span>
                  <span className="bg-[#4262ff]/5 px-4 py-2 rounded-xl text-sm font-bold text-[#4262ff] flex items-center gap-2 border border-[#4262ff]/10">
                    <IdentificationIcon className="w-4 h-4" /> Patient ID: SH-9283-JD
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Emergency Priority</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-red-500 font-bold">Critical Allergies Listed</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              {/* Left Column: Stats & Vitals */}
              <div className="space-y-12">
                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4262ff] mb-6 flex items-center gap-2">
                    <HeartIcon className="w-4 h-4" /> Physical Vitals
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-5 rounded-3xl">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Height</p>
                      <p className="text-xl font-bold text-gray-900">{patient?.height}</p>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-3xl">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Weight</p>
                      <p className="text-xl font-bold text-gray-900">{patient?.weight}</p>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-3xl">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Blood Group</p>
                      <p className="text-xl font-black text-[#4262ff]">{patient?.bloodGroup}</p>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-3xl">
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Genotype</p>
                      <p className="text-xl font-bold text-gray-900">{patient?.genotype}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4262ff] mb-6 flex items-center gap-2">
                    <ScaleIcon className="w-4 h-4" /> Clinical Metrics
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Blood Sugar', val: patient?.bloodSugar },
                      { label: 'Blood Pressure', val: patient?.bloodPressure },
                      { label: 'SpO2 Level', val: patient?.spO2 },
                    ].map((m, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                        <span className="text-sm font-bold text-gray-500">{m.label}</span>
                        <span className="text-sm font-black text-gray-900">{m.val}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-500 mb-6 flex items-center gap-2">
                    <InformationCircleIcon className="w-4 h-4" /> Allergies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {patient?.allergies.map((a: string) => (
                      <span key={a} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold border border-red-100">
                        {a}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4262ff] mb-6 flex items-center gap-2">
                    <UserPlusIcon className="w-4 h-4" /> Emergency Contacts
                  </h3>
                  <div className="space-y-4">
                    {patient?.emergencyContacts.map((c: any, i: number) => (
                      <div key={i} className="border-l-4 border-[#4262ff] pl-4 py-1">
                        <p className="font-bold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{c.relationship} • {c.phone}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Middle/Right: History & Records */}
              <div className="lg:col-span-2 space-y-16">
                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4262ff] mb-8 flex items-center gap-2">
                    <ClipboardDocumentListIcon className="w-4 h-4" /> Medical History
                  </h3>
                  <div className="grid md:grid-cols-2 gap-12">
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Family History</h4>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        {patient?.familyHistory}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Medication History</h4>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        {patient?.medicationHistory}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#4262ff] flex items-center gap-2">
                      <BeakerIcon className="w-4 h-4" /> Clinical Records
                    </h3>
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                      {[
                        { id: 'all', label: 'All', icon: FunnelIcon },
                        { id: 'lab', label: 'Labs', icon: BeakerIcon },
                        { id: 'rad', label: 'Imaging', icon: IdentificationIcon },
                        { id: 'pres', label: 'Prescriptions', icon: PencilSquareIcon },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeCategory === cat.id ? 'bg-white text-[#4262ff] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <cat.icon className="w-3.5 h-3.5" />
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {filteredRecords.map((r) => (
                      <div key={r.id} className="group p-6 bg-gray-50 rounded-[32px] border border-transparent hover:border-[#4262ff]/20 hover:bg-white transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-black text-gray-900 group-hover:text-[#4262ff] transition-colors">{r.title}</h4>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{r.date}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
                          <div>
                            <p className="text-[9px] font-black uppercase text-gray-400">Facility</p>
                            <p className="text-xs font-bold text-gray-700">{r.facility}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase text-gray-400">Practitioner</p>
                            <p className="text-xs font-bold text-gray-700">{r.doctor}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-white/50 rounded-2xl border border-gray-100">
                          <p className="text-xs text-gray-500 leading-relaxed italic line-clamp-2">
                            "{r.content}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center pb-20">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-full shadow-lg shadow-blue-500/5">
            <ShieldCheckIcon className="w-4 h-4 text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verified & Encrypted • Selorah Health Infrastructure</span>
          </div>
        </footer>
      </div>

      {/* Visit Report Modal */}
      {showVisitReportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0A0B14]/90 backdrop-blur-xl p-6">
          <div className="max-w-2xl w-full bg-white rounded-[40px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">Add Visit Report</h3>
                  <p className="text-gray-500 font-medium">Record a new interaction for {patient?.first_name}.</p>
                </div>
                <button onClick={() => setShowVisitReportModal(false)} className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <XMarkIcon className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Facility</label>
                    <input type="text" defaultValue="Selorah Medical Center" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Doctor</label>
                    <input type="text" defaultValue="Dr. Admin" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-700" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Observations & Notes</label>
                  <textarea 
                    placeholder="Describe visit details, diagnosis, or recommendations..." 
                    className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-6 py-4 font-medium text-gray-700 h-40 focus:outline-none focus:border-[#4262ff] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Attachments (Lab Results, Prescriptions)</label>
                  <div className="border-2 border-dashed border-gray-100 rounded-[32px] p-10 text-center hover:border-[#4262ff]/30 transition-colors cursor-pointer group">
                    <CloudArrowUpIcon className="w-10 h-10 text-gray-300 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-bold text-gray-400">Drop files here or <span className="text-[#4262ff]">browse</span></p>
                    <p className="text-[10px] text-gray-300 mt-2 font-medium">Auto-title feature: Titles will be inferred from document content.</p>
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button onClick={() => setShowVisitReportModal(false)} className="flex-1 bg-gray-50 text-gray-900 py-5 rounded-2xl font-bold hover:bg-gray-100 transition-all">Cancel</button>
                  <button 
                    onClick={() => {
                      alert('Visit report submitted and co-signed successfully!');
                      setShowVisitReportModal(false);
                    }}
                    className="flex-[2] bg-[#4262ff] text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 hover:bg-[#3252DF] transition-all flex items-center justify-center gap-3"
                  >
                    Submit Report <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CloudArrowUpIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
  );
}
