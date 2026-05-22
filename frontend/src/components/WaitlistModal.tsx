import { useState, useEffect } from 'react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setStatus('idle');
      setFullName('');
      setEmail('');
      setErrorMsg(null);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) return;
    setStatus('loading');
    setErrorMsg(null);
    try {

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
      setStatus('idle');
    }

  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      ></div>
      <div className="relative bg-[#111224] border border-[#6183FF]/20 rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#6183FF] opacity-10 blur-3xl rounded-full pointer-events-none"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A0A4C8] hover:text-white transition-colors p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {status === 'success' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#5DFFAD]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#5DFFAD" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">You are in!</h3>
            <p className="text-[#A0A4C8] text-lg leading-relaxed">
              Congratulations <span className="text-white font-medium">{fullName}</span>, you are on the list. We will notify you as soon as early access opens.
            </p>
            <button 
              onClick={onClose}
              className="mt-8 w-full bg-[#6183FF] text-white font-medium py-3 rounded-full hover:bg-[#4D6ED6] transition-colors"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Join the early wave</h3>
            <p className="text-[#A0A4C8] mb-8">
              Be among the first to experience true ownership of your medical records.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {errorMsg}
                </div>
              )}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[#A0A4C8] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-[#0A0B14] border border-[#6183FF]/20 rounded-xl px-4 py-3 text-white placeholder-[#6B6F8E] focus:outline-none focus:border-[#6183FF] focus:ring-1 focus:ring-[#6183FF] transition-all"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#A0A4C8] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0A0B14] border border-[#6183FF]/20 rounded-xl px-4 py-3 text-white placeholder-[#6B6F8E] focus:outline-none focus:border-[#6183FF] focus:ring-1 focus:ring-[#6183FF] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-[#6183FF] text-white font-medium py-3 rounded-xl hover:bg-[#4D6ED6] transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {status === 'loading' ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  'Join Waitlist'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
