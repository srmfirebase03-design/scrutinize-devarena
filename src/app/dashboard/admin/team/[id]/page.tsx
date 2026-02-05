import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import Link from "next/link"

export default async function TeamDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: { evaluation: { include: { evaluator: true } } }
  })

  if (!team) return <div>Team not found</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto py-12 px-6">
        
        {/* Navigation */}
        <Link href="/dashboard/admin" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-2 mb-8 uppercase tracking-widest">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Overview
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded">Team Profile</span>
              <h1 className="text-4xl font-bold text-slate-900 mt-4">{team.teamName}</h1>
              <p className="text-slate-500 font-medium mt-1">{team.email}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${
              team.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              team.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {team.status}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            <div className="p-8">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Problem Statement</label>
              <p className="font-bold text-slate-700">{team.psNumber || "N/A"}</p>
            </div>
            <div className="p-8">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Format</label>
              <p className="font-bold text-slate-700 uppercase">{team.fileType}</p>
            </div>
            <div className="p-8">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Attendance</label>
              <p className={`font-bold ${team.attendance ? 'text-emerald-600' : 'text-slate-400 italic'}`}>
                {team.attendance ? "CONFIRMED" : "AWAITING"}
              </p>
            </div>
          </div>

          {/* Evaluation Content */}
          <div className="p-10">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Evaluator Feedback</h3>
            
            {team.evaluation ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {team.evaluation.evaluator.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{team.evaluation.evaluator.username.toUpperCase()}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Official Scrutinizer</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-8 rounded-xl border border-slate-100">
                  <p className="text-slate-700 italic leading-relaxed text-lg">&quot;{team.evaluation.comments}&quot;</p>
                </div>
                
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Reviewed on {team.evaluation.createdAt.toLocaleDateString()}</p>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-400 italic">This team has not been reviewed yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Drive Link */}
        <a 
          href={`https://drive.google.com/file/d/${team.driveFileId}/view`} 
          target="_blank"
          className="w-full bg-slate-900 text-white p-6 rounded-xl font-bold flex justify-between items-center hover:bg-black transition-all shadow-xl"
        >
          <span>View Original Submission on Google Drive</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </main>
    </div>
  )
}
