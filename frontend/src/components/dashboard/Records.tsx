import { CloudArrowUpIcon, ChevronRightIcon, QrCodeIcon, DocumentTextIcon, ShareIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface Record {
  id: string;
  name: string;
  date: string;
  status: string;
  icon: string;
}

interface RecordsProps {
  records: Record[];
  handleUploadClick: () => void;
}

export default function Records({ records, handleUploadClick }: RecordsProps) {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('selorah_demo_upload');
    if (saved) setUploadedFile(saved);
    
    const handleStorage = () => {
      const s = localStorage.getItem('selorah_demo_upload');
      if (s) setUploadedFile(s);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="space-y-10 font-sora">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-[#101217] tracking-tight">Health Records</h2>
        <p className="text-gray-400 font-medium text-base">Securely manage and organize your clinical data.</p>
      </div>

      {/* Records Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Records', value: records.length.toString().padStart(2, '0'), icon: DocumentTextIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Shared Records', value: '01', icon: ShareIcon, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Security Health', value: '98%', icon: ShieldCheckIcon, color: 'text-green-500', bg: 'bg-green-50' },
        ].map((card, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-xl shadow-blue-500/5 hover:border-[#6183FF]/30 transition-all group">
            <div className={`w-12 h-12 ${card.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-3xl font-black text-[#101217]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#101217]">All Records</h3>
              <button onClick={handleUploadClick} className="text-[#6183FF] font-bold text-sm flex items-center gap-1 group hover:underline">
                Upload New <CloudArrowUpIcon className="w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {uploadedFile && (
                <div className="flex items-center justify-between py-4 first:pt-0 hover:bg-gray-50 px-2 -mx-2 rounded-xl transition-colors cursor-pointer border-l-4 border-green-500 animate-in fade-in slide-in-from-left-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center p-2">
                      <img src="/assets/total-records-card-icon.png" alt="R" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="font-bold text-[#101217] text-base">New Uploaded Document</p>
                      <p className="text-[12px] text-gray-400 font-medium">Just now • Demo Preview Available</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-wider">New</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(uploadedFile, '_blank');
                      }}
                      className="text-[#6183FF] text-[10px] font-black uppercase hover:underline"
                    >
                      View Original
                    </button>
                  </div>
                </div>
              )}
              {records.map((record) => (
                <div key={record.id} onClick={() => navigate(`/dashboard/records/${record.id}`)} className="flex items-center justify-between py-4 last:pb-0 hover:bg-gray-50 px-2 -mx-2 rounded-xl transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#F8F9FE] rounded-xl flex items-center justify-center p-1.5">
                      <img src={record.icon} alt="R" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="font-bold text-[#101217] text-base">{record.name}</p>
                      <p className="text-[12px] text-gray-400 font-medium">{record.date}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${record.status === 'Shared Once' ? 'bg-[#EEF2FF] text-[#6183FF]' : 'bg-[#6183FF] text-white'}`}>{record.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-6">
          {/* QR Code Gen Card */}
          <div onClick={() => navigate('/dashboard/qrcodes')} className="bg-[#6183FF] text-white rounded-[32px] p-8 shadow-sm cursor-pointer hover:opacity-90 transition-opacity flex flex-col items-center justify-center text-center min-h-[200px]">
            <QrCodeIcon className="w-16 h-16 mb-4 text-white/80 drop-shadow-md" />
            <h3 className="text-xl font-bold mb-2">Generate QR Code</h3>
            <p className="text-sm text-white/80">Create temporary access codes for healthcare providers</p>
          </div>

          {/* Access Log Card */}
          <div onClick={() => navigate('/dashboard/access-log')} className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-8 cursor-pointer hover:border-[#6183FF]/30 transition-colors min-h-[200px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#101217]">Access Log</h3>
              <ChevronRightIcon className="w-4 h-4 text-[#6183FF]" />
            </div>
            <div className="space-y-5">
              {[
                { title: 'Reddington Hospital', time: '2hr ago', color: 'bg-[#22C55E]' },
                { title: 'St. Nicholas Hospital', time: 'Yesterday', color: 'bg-[#FACC15]' },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${log.color} mt-1 shrink-0 border border-white shadow-sm`}></div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#101217] leading-tight">{log.title}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
