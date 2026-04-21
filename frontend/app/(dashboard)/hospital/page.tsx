export default function HospitalDashboard() {
  const mockData = {
    patientsAccessed: 156,
    recordsScanned: 342,
    activeStudies: 8,
    monthlyEarnings: 45000,
    currency: 'NGN',
    recentScans: [
      { id: 1, patientId: 'P-2341', date: '2024-04-18 14:30', recordType: 'Blood Work', status: 'Completed' },
      { id: 2, patientId: 'P-2089', date: '2024-04-18 12:15', recordType: 'X-Ray', status: 'Completed' },
      { id: 3, patientId: 'P-1945', date: '2024-04-18 10:45', recordType: 'Prescription', status: 'Completed' },
    ],
    topPatients: [
      { id: 1, name: 'Amaka Osei', accesses: 12, lastAccess: '2024-04-18' },
      { id: 2, name: 'Chioma Nwosu', accesses: 9, lastAccess: '2024-04-17' },
      { id: 3, name: 'Zainab Mohamed', accesses: 7, lastAccess: '2024-04-16' },
    ],
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Lagos Island General Hospital</h1>
        <p className="text-[#A0A4C8]">Manage patient records and research access</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Patients Accessed', value: mockData.patientsAccessed, icon: '👥' },
          { label: 'Records Scanned', value: mockData.recordsScanned, icon: '📱' },
          { label: 'Active Studies', value: mockData.activeStudies, icon: '🔬' },
          { label: 'Monthly Earnings', value: `₦${mockData.monthlyEarnings.toLocaleString()}`, icon: '💰' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#111224] border border-[rgba(97,131,255,0.1)] rounded-2xl p-6">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-[#A0A4C8] text-xs uppercase tracking-wide mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Scans & Top Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans */}
        <div className="bg-[#111224] border border-[rgba(97,131,255,0.1)] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent QR Scans</h2>
          <div className="space-y-3">
            {mockData.recentScans.map(scan => (
              <div key={scan.id} className="flex items-between justify-between p-3 rounded-xl bg-[#1A1C35] hover:bg-[#1F2145] transition-colors cursor-pointer">
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{scan.patientId}</div>
                  <div className="text-[#6B6F8E] text-xs">{scan.recordType}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#5DFFAD] text-xs">✓</span>
                  <span className="text-[#A0A4C8] text-xs">{scan.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Patients */}
        <div className="bg-[#111224] border border-[rgba(97,131,255,0.1)] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top Patients This Month</h2>
          <div className="space-y-3">
            {mockData.topPatients.map((patient, idx) => (
              <div key={patient.id} className="flex items-between justify-between p-3 rounded-xl bg-[#1A1C35] hover:bg-[#1F2145] transition-colors cursor-pointer">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6183FF] to-[#5DFFAD] flex items-center justify-center text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{patient.name}</div>
                    <div className="text-[#6B6F8E] text-xs">Last: {patient.lastAccess}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#6183FF] text-sm font-medium">{patient.accesses}x</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
