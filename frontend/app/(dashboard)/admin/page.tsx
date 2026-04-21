export default function AdminDashboard() {
  const mockData = {
    totalUsers: 3240,
    activeTransactions: 156,
    monthlyRevenue: 850000,
    currency: 'NGN',
    systemHealth: 99.8,
    userBreakdown: [
      { role: 'Patients', count: 2100, percentage: 64.8 },
      { role: 'Hospitals', count: 340, percentage: 10.5 },
      { role: 'Researchers', count: 560, percentage: 17.3 },
      { role: 'Admins', count: 240, percentage: 7.4 },
    ],
    recentTransactions: [
      { id: 1, user: 'Amaka Osei', type: 'Record Access', amount: '₦2,500', date: '2024-04-18', status: 'Completed' },
      { id: 2, user: 'Lagos Hospital', type: 'Research Data', amount: '₦15,000', date: '2024-04-18', status: 'Completed' },
      { id: 3, user: 'Dr. Nduka', type: 'Study Dataset', amount: '₦50,000', date: '2024-04-17', status: 'Completed' },
      { id: 4, user: 'Victoria Medical', type: 'Record Access', amount: '₦3,000', date: '2024-04-17', status: 'Pending' },
    ],
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-[#A0A4C8]">System overview and management</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: mockData.totalUsers.toLocaleString(), icon: '👥' },
          { label: 'Active Transactions', value: mockData.activeTransactions, icon: '💳' },
          { label: 'Monthly Revenue', value: `₦${mockData.monthlyRevenue.toLocaleString()}`, icon: '💰' },
          { label: 'System Health', value: `${mockData.systemHealth}%`, icon: '🏥' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#111224] border border-[rgba(97,131,255,0.1)] rounded-2xl p-6">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-[#A0A4C8] text-xs uppercase tracking-wide mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* User Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Breakdown */}
        <div className="bg-[#111224] border border-[rgba(97,131,255,0.1)] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">User Breakdown</h2>
          <div className="space-y-4">
            {mockData.userBreakdown.map((user, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#A0A4C8] text-sm">{user.role}</span>
                  <span className="text-white font-semibold">{user.count.toLocaleString()}</span>
                </div>
                <div className="w-full bg-[#1A1C35] rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#6183FF] to-[#5DFFAD] h-2 rounded-full"
                    style={{ width: `${user.percentage}%` }}
                  ></div>
                </div>
                <div className="text-[#6B6F8E] text-xs mt-1">{user.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="bg-[#111224] border border-[rgba(97,131,255,0.1)] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Revenue Trend</h2>
          <div className="space-y-3">
            {[
              { week: 'Week 1', revenue: 180000, bars: 6 },
              { week: 'Week 2', revenue: 210000, bars: 7 },
              { week: 'Week 3', revenue: 195000, bars: 6 },
              { week: 'Week 4', revenue: 265000, bars: 9 },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#A0A4C8] text-sm">{item.week}</span>
                  <span className="text-white font-semibold">₦{(item.revenue / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex items-end gap-1 h-8">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm transition-colors ${
                        i < item.bars
                          ? 'bg-gradient-to-t from-[#6183FF] to-[#5DFFAD]'
                          : 'bg-[#1A1C35]'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-[#111224] border border-[rgba(97,131,255,0.1)] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[rgba(97,131,255,0.1)]">
              <tr>
                <th className="text-left text-[#A0A4C8] text-xs uppercase tracking-wide py-3 px-2">User</th>
                <th className="text-left text-[#A0A4C8] text-xs uppercase tracking-wide py-3 px-2">Type</th>
                <th className="text-left text-[#A0A4C8] text-xs uppercase tracking-wide py-3 px-2">Amount</th>
                <th className="text-left text-[#A0A4C8] text-xs uppercase tracking-wide py-3 px-2">Date</th>
                <th className="text-left text-[#A0A4C8] text-xs uppercase tracking-wide py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockData.recentTransactions.map(tx => (
                <tr key={tx.id} className="border-b border-[rgba(97,131,255,0.1)] hover:bg-[#1A1C35]/50 transition-colors">
                  <td className="text-white text-sm py-3 px-2">{tx.user}</td>
                  <td className="text-[#A0A4C8] text-sm py-3 px-2">{tx.type}</td>
                  <td className="text-[#6183FF] font-semibold text-sm py-3 px-2">{tx.amount}</td>
                  <td className="text-[#A0A4C8] text-sm py-3 px-2">{tx.date}</td>
                  <td className="py-3 px-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      tx.status === 'Completed'
                        ? 'bg-[#5DFFAD]/20 text-[#5DFFAD]'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
