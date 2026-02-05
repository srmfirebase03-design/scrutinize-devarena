import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import EvaluationPanel from "@/components/EvaluationPanel"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getEvaluatorQueue } from "@/lib/cache"
import FinalizeButton from "@/components/FinalizeButton"

export default async function EvaluatorDashboard(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams
  const selectedTeamId = searchParams?.teamId
  const session = (await getServerSession(authOptions)) as any
  const userId = session?.user?.id

  // Use CACHED Queue
  const allPendingTeams = await getEvaluatorQueue()
  
  // Strict Folder-Based Assignment Logic:
  const evaluatorUsername = session?.user?.name // e.g. "eval1", "eval2", "eval3"
  
  // Helper to normalize folder names (remove spaces)
  const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase()

  const myQueue = allPendingTeams.filter((t: any) => {
    const folder = normalize(t.folderName || "")
    
    if (evaluatorUsername === "eval1") return folder === "ps1&ps2"
    if (evaluatorUsername === "eval2") return folder === "ps3ps4"
    if (evaluatorUsername === "eval3") return folder === "ps4"
    
    return false
  })

  // 2. Get "My Starred Teams" directly from DB to be accurate
  // We need to fetch all starred and filter in memory because of the loose matching
  // OR we keep strict matching for DB queries if we assume DB is consistent, 
  // but if DB has "PS1 & PS2", strict query for "PS1&PS2" fails.
  // Safer to fetch all starred and filter.
  const allStarred = await prisma.team.findMany({
    where: { isStarred: true },
    select: { id: true, teamName: true, folderName: true }
  })

  const myStarredTeams = allStarred.filter((t: any) => {
    const folder = normalize(t.folderName || "")
    if (evaluatorUsername === "eval1") return folder === "ps1&ps2"
    if (evaluatorUsername === "eval2") return folder === "ps3ps4"
    if (evaluatorUsername === "eval3") return folder === "ps4"
    return false
  })

  const selectedTeam = selectedTeamId 
    ? await prisma.team.findUnique({ where: { id: selectedTeamId } })
    : null

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl h-full flex-shrink-0">
          
          {/* Progress Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Shortlist Progress</h2>
            
            <div className="flex items-end justify-between mb-2">
              <span className={`text-2xl font-black ${myStarredTeams.length > 15 ? 'text-rose-500' : 'text-indigo-600'}`}>
                {myStarredTeams.length}
                <span className="text-sm text-slate-400 font-medium ml-1">/ 15</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required</span>
            </div>
            
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${myStarredTeams.length > 15 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min((myStarredTeams.length / 15) * 100, 100)}%` }}
              ></div>
            </div>

            {/* Finalize Action */}
            <div className="mt-6">
              <FinalizeButton count={myStarredTeams.length} />
            </div>
          </div>
          
          <ul className="flex-1 overflow-y-auto custom-scrollbar">
            {myQueue.map((team: any) => (
              <li key={team.id}>
                <a
                  href={`/dashboard/evaluator?teamId=${team.id}`}
                  className={`group block p-5 border-l-4 transition-all ${
                    selectedTeamId === team.id 
                      ? 'bg-indigo-50 border-indigo-600' 
                      : 'border-transparent hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-bold text-sm truncate pr-2 ${selectedTeamId === team.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {team.teamName}
                    </span>
                    {/* Star Icon if selected */}
                    {myStarredTeams.some((st: any) => st.id === team.id) && (
                      <svg className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">
                      {team.psNumber || 'N/A'}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 relative overflow-y-auto scroll-smooth bg-black">
          {selectedTeam ? (
            <EvaluationPanel key={selectedTeam.id} team={selectedTeam} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50/50">
              <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700">Ready to Shortlist?</h3>
              <p className="mt-2 text-slate-500">Select 15 teams from your folder to proceed.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
