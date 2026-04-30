import { useParams } from 'react-router-dom';
import { ShieldCheckIcon, CalendarIcon, IdentificationIcon, BeakerIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function SharedRecord() {
  const { token } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selorah_user');
    if (saved) {
      setPatient(JSON.parse(saved));
    }

    // Parse token: random_expiry_timestamp
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
  }, [token]);

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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[40px] p-12 text-center shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ClockIcon className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-[#101217] mb-4">Access Expired</h2>
          <p className="text-gray-500 font-medium leading-relaxed">
            The temporary access token for this medical record has expired. Please request a new QR code from the patient.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-10 text-[#6183FF] font-bold hover:underline"
          >
            Go to Selorah Health Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sora py-12 px-6 flex justify-center selection:bg-[#4262ff]/10">
      <div className="max-w-2xl w-full bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-blue-500/5 p-8 md:p-14 overflow-hidden relative">
        {/* Top Decorative Blur */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4262ff]/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

        <div className="flex items-center gap-4 mb-12 border-b border-gray-50 pb-10 relative z-10">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="/logo.svg" alt="Selorah Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-[#0A0B14]">Selorah Health</span>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4262ff]">Secure Health Link</p>
          </div>
          <div className="ml-auto flex flex-col items-end gap-2">
            <span className="bg-[#4262ff]/10 text-[#4262ff] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-1.5 border border-[#4262ff]/20">
              <ShieldCheckIcon className="w-3 h-3" />
              Verified Access
            </span>
            {timeLeft !== null && (
              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border flex items-center gap-1 ${timeLeft < 60 ? 'bg-red-50 text-red-500 border-red-100 animate-pulse' : 'bg-blue-50 text-[#6183FF] border-blue-100'}`}>
                <ClockIcon className="w-3 h-3" />
                Lockout in {formatTime(timeLeft)}
              </span>
            )}
          </div>
        </div>

        <div className="mb-12 relative z-10">
          <h1 className="text-4xl font-black text-[#0A0B14] mb-3 tracking-tight">Patient Medical History</h1>
          <p className="text-gray-400 font-medium text-base">
            Access granted via secure token: <span className="font-mono text-[#4262ff] bg-[#4262ff]/5 px-2 py-0.5 rounded">{token?.split('_')[0]}...</span>
          </p>
        </div>

        <div className="space-y-8 relative z-10">
          <div className="p-8 bg-white rounded-[32px] border border-gray-50 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <IdentificationIcon className="w-5 h-5 text-[#4262ff]" />
              <h3 className="font-black text-[#0A0B14] uppercase tracking-widest text-xs">Patient Profile</h3>
            </div>
            <div className="grid grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Full Name</p>
                <p className="font-bold text-[#0A0B14]">{patient ? `${patient.first_name} ${patient.last_name}` : 'John Olusegun Doe'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Date of Birth</p>
                <p className="font-bold text-[#0A0B14]">Jan 15, 1990 (36Y)</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Blood Type</p>
                <p className="font-black text-[#4262ff] text-lg">O Positive</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Allergies</p>
                <p className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg inline-block">Penicillin, Peanuts</p>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white rounded-[32px] border border-gray-50 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BeakerIcon className="w-5 h-5 text-[#4262ff]" />
              <h3 className="font-black text-[#0A0B14] uppercase tracking-widest text-xs">Recent Clinical Records</h3>
            </div>
            <div className="space-y-4">
              {[
                { name: 'SNH Comprehensive Lab Result', date: 'April 7, 2026', type: 'Lab' },
                { name: 'Yellow Fever Vaccination Certificate', date: 'April 5, 2026', type: 'Vaccine' },
                { name: 'Cardiology Consultation Summary', date: 'March 28, 2026', type: 'Note' },
              ].map((record, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-[#4262ff]/20 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <CalendarIcon className="w-5 h-5 text-gray-400 group-hover:text-[#4262ff] transition-colors" />
                    </div>
                    <div>
                      <p className="font-bold text-[#0A0B14] text-sm group-hover:text-[#4262ff] transition-colors">{record.name}</p>
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">{record.date} • {record.type}</p>
                    </div>
                  </div>
                  <button className="text-[#4262ff] text-xs font-black uppercase tracking-widest bg-[#4262ff]/10 px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] border-t border-gray-50 pt-8 w-full justify-center">
            <ShieldCheckIcon className="w-4 h-4" />
            End-to-End Encrypted Data • Powered by Selorah Health
          </div>
        </div>
      </div>
    </div>
  );
}
