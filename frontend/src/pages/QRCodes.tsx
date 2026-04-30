import { useState, useEffect } from 'react';
import { QrCodeIcon, ClockIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { QRCodeCanvas } from 'qrcode.react';

export default function QRCodes() {
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<string>('none');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const generateCode = () => {
    const randomPart = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now();
    const token = `${randomPart}_${expiry}_${timestamp}`;
    setQrToken(token);
    
    if (expiry !== 'none') {
      const minutes = parseInt(expiry);
      setTimeLeft(minutes * 60);
    } else {
      setTimeLeft(null);
    }
  };

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const domain = window.location.origin;

  return (
    <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-10 min-h-[500px] flex flex-col items-center justify-center text-center font-sora">
      {!qrToken ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md w-full">
          <div className="w-24 h-24 bg-[#EEF2FF] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
            <QrCodeIcon className="w-12 h-12 text-[#6183FF]" />
          </div>
          <h2 className="text-3xl font-bold text-[#101217] mb-3">Temporary Access Codes</h2>
          <p className="text-gray-500 mb-10">Generate a secure QR code to instantly share specific medical records with doctors during visits.</p>
          
          <div className="mb-10 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">Set Access Duration (Optional)</label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'None', val: 'none' },
                { label: '10m', val: '10' },
                { label: '1h', val: '60' },
                { label: '24h', val: '1440' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setExpiry(opt.val)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                    expiry === opt.val 
                    ? 'bg-[#6183FF] text-white border-[#6183FF] shadow-lg shadow-blue-500/20' 
                    : 'bg-white text-gray-400 border-gray-100 hover:border-[#6183FF]/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={generateCode} 
            className="w-full bg-[#6183FF] text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-[#4E6EEF] transition-all flex items-center justify-center gap-3"
          >
            Generate Secure QR Code
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center animate-in zoom-in duration-500 w-full">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <h2 className="text-2xl font-bold text-[#101217]">Access Token Active</h2>
          </div>
          <p className="text-gray-500 mb-8 max-w-sm">Ask your doctor to scan this code to view your verified medical history.</p>
          
          <div className="bg-white p-8 border border-gray-100 rounded-[40px] shadow-2xl shadow-blue-500/5 mb-8 flex items-center justify-center relative">
            <QRCodeCanvas 
              value={`${domain}/shared/${qrToken}`} 
              size={240}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: "/logo.png",
                x: undefined,
                y: undefined,
                height: 50,
                width: 50,
                excavate: true,
              }}
            />
          </div>
          
          {timeLeft !== null && (
            <div className={`mb-8 flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm ${timeLeft < 60 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#6183FF]'}`}>
              <ClockIcon className="w-4 h-4" />
              Expires in: {formatTime(timeLeft)}
            </div>
          )}

          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-300 w-full text-center">Secure Link</div>
            <a 
              href={`${domain}/shared/${qrToken}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-500 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 w-full truncate font-mono text-center hover:bg-gray-100 hover:text-[#6183FF] transition-all cursor-pointer"
            >
              {domain}/shared/{qrToken}
            </a>
          </div>

          <button onClick={() => setQrToken(null)} className="mt-10 flex items-center gap-2 text-gray-400 font-bold text-sm hover:text-[#6183FF] transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to generation
          </button>
        </div>
      )}
    </div>
  );
}
