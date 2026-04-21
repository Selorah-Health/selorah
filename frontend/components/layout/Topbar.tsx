'use client'

import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function Topbar({ user, role }: { user: User; role: string }) {
  const router = useRouter()

  async function handleSignOut() {
    // TODO: Connect Supabase signout when integrated
    console.log('Sign out clicked')
    // await supabase.auth.signOut()
    // router.push('/login')
    // router.refresh()
  }

  const initials = user.email?.slice(0, 2).toUpperCase() || 'SL'

  return (
    <header className="h-14 bg-[#111224] border-b border-[rgba(97,131,255,0.1)] flex items-center justify-between px-6 flex-shrink-0">
      {/* Left — breadcrumb placeholder */}
      <div className="text-[#6B6F8E] text-sm capitalize">
        {role} Dashboard
      </div>

      {/* Right — user menu */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-white text-sm font-medium">{user.email}</div>
          <div className="text-[#6B6F8E] text-xs capitalize">{role}</div>
        </div>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6183FF] to-[#5DFFAD] flex items-center justify-center text-white text-xs font-bold font-['Syne']">
          {initials}
        </div>

        <button
          onClick={handleSignOut}
          className="text-[#6B6F8E] hover:text-white text-sm transition-colors ml-1"
          title="Sign out"
        >
          🚪
        </button>
      </div>
    </header>
  )
}
