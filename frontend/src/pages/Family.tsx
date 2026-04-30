import { useState } from 'react';
import { UserGroupIcon, ArrowLeftIcon, PlusIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function Family() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([
    { id: 1, name: 'Sarah Olusegun', relation: 'Spouse', access: 'Full Access', color: 'bg-pink-500' },
    { id: 2, name: 'David Olusegun', relation: 'Son', access: 'Emergency Only', color: 'bg-blue-500' },
  ]);

  const handleAddMember = () => {
    const name = prompt('Enter family member full name:');
    if (name) {
      const newMember = {
        id: Date.now(),
        name,
        relation: 'Relative',
        access: 'View Only',
        color: 'bg-purple-500'
      };
      setMembers([...members, newMember]);
      alert(`${name} has been added to your family group.`);
    }
  };

  const removeMember = (id: number, name: string) => {
    if (window.confirm(`Remove ${name} from family group?`)) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-8 font-sora">
      <button onClick={() => navigate('/dashboard/profile')} className="flex items-center gap-2 text-gray-400 hover:text-[#6183FF] transition-all group">
        <ArrowLeftIcon className="w-4 h-4" />
        <span className="font-bold text-sm">Back to Profile</span>
      </button>

      <div className="bg-white rounded-[40px] border border-gray-50 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#101217] tracking-tight">Family Management</h2>
              <p className="text-gray-400 font-medium text-sm">Manage emergency access and health sharing for your loved ones.</p>
            </div>
          </div>
          <button 
            onClick={handleAddMember}
            className="bg-[#6183FF] text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-[#4E6EEF] transition-all flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" /> Add Member
          </button>
        </div>

        <div className="p-10 md:p-14">
          {members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {members.map((member) => (
                <div key={member.id} className="p-6 bg-gray-50/50 border border-transparent hover:border-[#6183FF]/20 rounded-[32px] transition-all group flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 ${member.color} rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-[#101217] text-lg">{member.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{member.relation}</span>
                        <span className="text-gray-200">•</span>
                        <span className="text-[10px] font-black text-[#6183FF] uppercase tracking-widest">{member.access}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeMember(member.id, member.name)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                <UserPlusIcon className="w-10 h-10 text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold">No family members added yet.</p>
              <button onClick={handleAddMember} className="mt-6 text-[#6183FF] font-bold hover:underline">Add your first member</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
