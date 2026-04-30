import { useState } from 'react';
import { ShieldCheckIcon, KeyIcon, DevicePhoneMobileIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function Security() {
  const navigate = useNavigate();
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Password updated successfully! This change is now active across your Selorah account.');
  };

  return (
    <div className="space-y-8 font-sora">
      <button onClick={() => navigate('/dashboard/profile')} className="flex items-center gap-2 text-gray-400 hover:text-[#6183FF] transition-all group">
        <ArrowLeftIcon className="w-4 h-4" />
        <span className="font-bold text-sm">Back to Profile</span>
      </button>

      <div className="bg-white rounded-[40px] border border-gray-50 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="p-10 border-b border-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-[#6183FF]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#101217] tracking-tight">Security Settings</h2>
              <p className="text-gray-400 font-medium text-sm">Manage your account protection and authentication methods.</p>
            </div>
          </div>
        </div>

        <div className="p-10 md:p-14 space-y-12">
          {/* Password Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <KeyIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-black text-[#101217] uppercase tracking-widest">Change Password</h3>
            </div>
            <form onSubmit={handleUpdatePassword} className="max-w-md space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:outline-none focus:border-[#6183FF] transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:outline-none focus:border-[#6183FF] transition-all" />
              </div>
              <button type="submit" className="bg-[#101217] text-white font-bold py-4 px-8 rounded-2xl hover:bg-[#2A2D35] transition-all">
                Update Password
              </button>
            </form>
          </section>

          {/* MFA Section */}
          <section className="pt-12 border-t border-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="text-sm font-black text-[#101217] uppercase tracking-widest">Two-Factor Authentication (MFA)</h3>
                  <p className="text-xs text-gray-400 font-medium mt-1">Add an extra layer of security to your account.</p>
                </div>
              </div>
              <button 
                onClick={() => setMfaEnabled(!mfaEnabled)}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${mfaEnabled ? 'bg-[#6183FF]' : 'bg-gray-200'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-all duration-300 ${mfaEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
