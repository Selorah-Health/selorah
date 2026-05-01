import { useParams } from 'react-router-dom';
import { 
  ShieldCheckIcon, 
  CalendarIcon, 
  IdentificationIcon, 
  BeakerIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';
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
        <div className="max-w-md w-full bg-white rounded-3xl p-10 md:p-12 text-center shadow-xl">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ClockIcon className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Expired</h2>
          <p className="text-gray-600 leading-relaxed">
            The temporary access token for this medical record has expired. 
            Please request a new secure link from the patient.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-8 w-full bg-gray-900 text-white py-4 rounded-2xl font-semibold hover:bg-black transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sora py-8 md:py-12 px-4 sm:px-6 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl md:rounded-[40px] border border-gray-100 shadow-xl shadow-blue-500/5 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 md:p-10 border-b border-gray-100 relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#4262ff]/5 rounded-full blur-3xl -mr-10 -mt-10 hidden sm:block" />
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.svg" alt="Selorah Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-[#0A0B14]">Selorah Health</span>
              <p className="text-xs font-bold uppercase tracking-widest text-[#4262ff]">Secure Health Link</p>
            </div>

            <div className="ml-auto flex flex-col items-end gap-2">
              <span className="bg-[#4262ff]/10 text-[#4262ff] text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 border border-[#4262ff]/20">
                <ShieldCheckIcon className="w-4 h-4" />
                Verified Access
              </span>
              
              {timeLeft !== null && (
                <span className={`text-xs font-bold px-4 py-1 rounded-full border flex items-center gap-1.5 transition-all ${
                  timeLeft < 300 
                    ? 'bg-red-50 text-red-600 border-red-200' 
                    : 'bg-blue-50 text-[#4262ff] border-blue-100'
                }`}>
                  <ClockIcon className="w-4 h-4" />
                  Expires in {formatTime(timeLeft)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 md:p-10 space-y-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#0A0B14] tracking-tight leading-tight">
              Patient Medical History
            </h1>
            <p className="text-gray-500 mt-2 text-sm md:text-base">
              Access granted via secure token: 
              <span className="font-mono text-[#4262ff] bg-[#4262ff]/5 px-2 py-0.5 rounded ml-1">
                {token?.split('_')[0]}...
              </span>
            </p>
          </div>

          {/* Patient Profile Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <IdentificationIcon className="w-6 h-6 text-[#4262ff]" />
              <h3 className="font-bold uppercase tracking-widest text-xs text-gray-500">Patient Profile</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                <p className="font-semibold text-lg text-gray-900">
                  {patient ? `${patient.first_name} ${patient.last_name}` : 'John Olusegun Doe'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date of Birth</p>
                <p className="font-semibold text-lg text-gray-900">Jan 15, 1990 (36Y)</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Blood Type</p>
                <p className="font-bold text-2xl text-[#4262ff]">O+</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Allergies</p>
                <p className="font-semibold text-red-600 bg-red-50 px-4 py-2 rounded-2xl inline-block">
                  Penicillin, Peanuts
                </p>
              </div>
            </div>
          </div>

          {/* Clinical Records */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <BeakerIcon className="w-6 h-6 text-[#4262ff]" />
              <h3 className="font-bold uppercase tracking-widest text-xs text-gray-500">Recent Clinical Records</h3>
            </div>

            <div className="space-y-4">
              {[
                { name: 'SNH Comprehensive Lab Result', date: 'April 7, 2026', type: 'Lab' },
                { name: 'Yellow Fever Vaccination Certificate', date: 'April 5, 2026', type: 'Vaccine' },
                { name: 'Cardiology Consultation Summary', date: 'March 28, 2026', type: 'Note' },
              ].map((record, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-gray-50 rounded-2xl hover:bg-white border border-transparent hover:border-[#4262ff]/20 transition-all group cursor-pointer"
                >
                  <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <CalendarIcon className="w-6 h-6 text-gray-400 group-hover:text-[#4262ff] transition-colors" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-[#4262ff] transition-colors line-clamp-1">
                      {record.name}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {record.date} • {record.type}
                    </p>
                  </div>

                  <button className="mt-3 sm:mt-0 text-[#4262ff] text-sm font-bold px-6 py-3 bg-white border border-[#4262ff]/20 rounded-2xl hover:bg-[#4262ff] hover:text-white transition-all whitespace-nowrap">
                    View Record
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 py-8 px-6 md:px-10 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-400">
            <ShieldCheckIcon className="w-4 h-4" />
            End-to-End Encrypted • Powered by Selorah Health
          </div>
        </div>
      </div>
    </div>
  );
}
