import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Selora Health — Sign In',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0A0B14] flex items-center justify-center p-4">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none"></div>

      {/* Content */}
      <div className="relative w-full max-w-md z-10">
        {children}
      </div>
    </div>
  )
}
