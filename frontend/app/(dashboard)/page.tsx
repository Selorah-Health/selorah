'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const currentRole = searchParams.get('role') || 'patient'

  const roles = [
    { value: 'patient', label: 'Patient', icon: '🧑‍⚕️', color: 'from-blue-500' },
    { value: 'hospital', label: 'Hospital', icon: '🏥', color: 'from-green-500' },
    { value: 'researcher', label: 'Researcher', icon: '🔬', color: 'from-purple-500' },
    { value: 'admin', label: 'Admin', icon: '📊', color: 'from-red-500' },
  ]

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-[#A0A4C8]">Select a role to view the dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map(role => (
          <Link key={role.value} href={`/patient?role=${role.value}`}>
            <div className={`bg-[#111224] border ${
              currentRole === role.value 
                ? 'border-[#6183FF] bg-[rgba(97,131,255,0.1)]' 
                : 'border-[rgba(97,131,255,0.1)] hover:border-[#6183FF]/50'
            } rounded-2xl p-6 cursor-pointer transition-all duration-200 h-full`}>
              <div className="text-4xl mb-3">{role.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-1">{role.label}</h3>
              <p className="text-[#A0A4C8] text-sm">
                {role.value === 'patient' && 'Manage your health records'}
                {role.value === 'hospital' && 'Access patient records'}
                {role.value === 'researcher' && 'Research & datasets'}
                {role.value === 'admin' && 'System management'}
              </p>
              {currentRole === role.value && (
                <div className="mt-4 pt-4 border-t border-[rgba(97,131,255,0.2)]">
                  <span className="text-[#5DFFAD] text-xs font-medium">✓ Currently viewing</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
