'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

const mockUser = {
  id: '123',
  email: 'demo@selora.health',
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'patient'

  return (
    <div className="min-h-screen bg-[#0A0B14] flex">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={mockUser as any} role={role} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={null}>
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  )
}