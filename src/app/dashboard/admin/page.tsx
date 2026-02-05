import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import SyncForm from "@/components/SyncForm"
import AdminTable from "@/components/AdminTable"
import AdminActions from "@/components/AdminActions"

export default async function AdminDashboard(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams
  const status = searchParams?.status || undefined
  const view = searchParams?.view || 'all'
  
  const teams = await prisma.team.findMany({
    where: view === 'attendance' ? { attendance: true } : (status ? { status } : {}),
    include: { evaluation: { include: { evaluator: true } } },
    orderBy: { teamName: 'asc' }
  })

  const stats = {
    total: await prisma.team.count(),
    approved: await prisma.team.count({ where: { status: "APPROVED" } }),
    rejected: await prisma.team.count({ where: { status: "REJECTED" } }),
    pending: await prisma.team.count({ where: { status: "PENDING" } }),
    attendance: await prisma.team.count({ where: { attendance: true } }),
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto py-12 px-6 w-full space-y-10">
        
        {/* Header & Sync */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-center lg:text-left underline decoration-indigo-500 decoration-4 underline-offset-8">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-4">Manage evaluations and attendance records.</p>
          </div>
          <div className="flex flex-col gap-4 w-full lg:w-auto items-end">
            <SyncForm />
            <AdminActions />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Teams" value={stats.total} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Rejected" value={stats.rejected} />
          <StatCard label="Pending" value={stats.pending} />
          <StatCard 
             label="Attending" 
             value={stats.attendance} 
             highlight={true} 
             href="/dashboard/admin?view=attendance"
          />
        </div>

        {/* View Selection */}
        <div className="flex items-center gap-6 border-b border-slate-200">
          <LinkTab label="All Submissions" active={view !== 'attendance'} href="/dashboard/admin" />
          <LinkTab label="Attendance List" active={view === 'attendance'} href="/dashboard/admin?view=attendance" />
        </div>

        {/* Filters */}
        {view !== 'attendance' && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Status:</span>
            {['ALL', 'APPROVED', 'REJECTED', 'PENDING'].map((s) => (
              <a
                key={s}
                href={`/dashboard/admin?status=${s === 'ALL' ? '' : s}`}
                className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider transition-all border ${
                  (status || 'ALL') === s 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {s}
              </a>
            ))}
          </div>
        )}

        {/* The Table & Modal Logic */}
        <AdminTable initialTeams={teams} />

      </main>
    </div>
  )
}

function StatCard({ label, value, highlight = false, href }: { label: string, value: number, highlight?: boolean, href?: string }) {
  const content = (
    <div className={`p-6 rounded-xl border transition-all ${
      highlight ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'
    }`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${highlight ? 'text-indigo-100' : 'text-slate-400'}`}>{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
  return href ? <a href={href} className="hover:scale-105 transition-transform">{content}</a> : content
}

function LinkTab({ label, active, href }: { label: string, active: boolean, href: string }) {
  return (
    <a 
      href={href} 
      className={`pb-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
        active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
      }`}
    >
      {label}
    </a>
  )
}