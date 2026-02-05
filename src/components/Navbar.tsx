import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function Navbar() {
  const session = (await getServerSession(authOptions)) as any

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold tracking-tight text-slate-900">
            scrutinize-devarena
          </span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-right hidden sm:block">
            <p className="font-medium text-slate-900">{session?.user?.name}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">{session?.user?.role}</p>
          </div>
          <Link 
            href="/api/auth/signout" 
            className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
          >
            Log out
          </Link>
        </div>
      </div>
    </nav>
  )
}