'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = {
  patient: [
    { label: 'Overview', href: '/patient', icon: '🏠' },
    { label: 'My Records', href: '/patient/records', icon: '📋' },
    { label: 'My QR Code', href: '/patient/qr', icon: '📱' },
    { label: 'Earnings', href: '/patient/earnings', icon: '💰' },
    { label: 'Access Log', href: '/patient/access-log', icon: '🔐' },
    { label: 'Consent', href: '/patient/consent', icon: '⚙️' },
    { label: 'Guardians', href: '/patient/guardians', icon: '🛡️' },
    { label: 'Profile', href: '/patient/profile', icon: '👤' },
  ],
  hospital: [
    { label: 'Overview', href: '/hospital', icon: '🏠' },
    { label: 'Scan QR', href: '/hospital/scan', icon: '📷' },
    { label: 'Recent Patients', href: '/hospital/patients', icon: '👥' },
    { label: 'Access History', href: '/hospital/access-history', icon: '📋' },
    { label: 'Research', href: '/hospital/research', icon: '🔬' },
    { label: 'Earnings', href: '/hospital/earnings', icon: '💰' },
    { label: 'Staff', href: '/hospital/staff', icon: '👤' },
  ],
  researcher: [
    { label: 'Overview', href: '/researcher', icon: '🏠' },
    { label: 'Marketplace', href: '/researcher/marketplace', icon: '🔬' },
    { label: 'My Studies', href: '/researcher/studies', icon: '📋' },
    { label: 'Payments', href: '/researcher/payments', icon: '💰' },
  ],
  admin: [
    { label: 'Overview', href: '/admin', icon: '📊' },
    { label: 'Patients', href: '/admin/patients', icon: '👥' },
    { label: 'Hospitals', href: '/admin/hospitals', icon: '🏥' },
    { label: 'Researchers', href: '/admin/researchers', icon: '🔬' },
    { label: 'Revenue', href: '/admin/revenue', icon: '💰' },
    { label: 'Transactions', href: '/admin/transactions', icon: '📈' },
    { label: 'Blockchain', href: '/admin/blockchain', icon: '⛓️' },
  ],
}

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const items = NAV[role as keyof typeof NAV] || NAV.patient

  return (
    <aside className="w-[220px] min-h-screen bg-[#111224] border-r border-[rgba(97,131,255,0.1)] flex flex-col py-6 flex-shrink-0 sticky top-0">
      {/* Logo */}
      <div className="px-5 mb-8">
        <span className="font-['Syne'] text-xl font-black text-white tracking-tight">
          Selora<span className="text-[#5DFFAD]">.</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {items.map(item => {
          const isActive = pathname === item.href ||
            (item.href !== `/${role}` && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-[rgba(97,131,255,0.12)] text-[#6183FF] font-medium'
                  : 'text-[#A0A4C8] hover:bg-[#1A1C35] hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Role badge */}
      <div className="px-4 mt-4">
        <div className="bg-[#1A1C35] border border-[rgba(97,131,255,0.1)] rounded-xl p-3">
          <div className="text-[10px] uppercase tracking-widest text-[#6B6F8E] mb-1">Signed in as</div>
          <div className="text-white text-sm font-medium capitalize">{role}</div>
        </div>
      </div>
    </aside>
  )
}
