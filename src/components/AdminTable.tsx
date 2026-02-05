"use client"

import { useState } from "react"

export default function AdminTable({ initialTeams }: { initialTeams: any[] }) {
  const [selectedTeam, setSelectedTeam] = useState<any>(null)

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Information</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feedback</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Presence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialTeams.map((team) => (
              <tr 
                key={team.id} 
                className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedTeam(team)}
              >
                <td className="px-6 py-6">
                  <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{team.teamName}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 uppercase font-mono">{team.psNumber || 'N/A'}</div>
                </td>
                <td className="px-6 py-6">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    team.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                    team.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {team.status}
                  </span>
                </td>
                <td className="px-6 py-6 max-w-[200px]">
                  {team.evaluation ? (
                    <p className="text-xs text-slate-500 truncate italic">&quot;{team.evaluation.comments}&quot;</p>
                  ) : <span className="text-slate-300 text-[10px] italic">Pending</span>}
                </td>
                <td className="px-6 py-6 text-right">
                  {team.attendance ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">CONFIRMED</span>
                  ) : <span className="text-slate-200">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* THE MODAL */}
      {selectedTeam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedTeam(null)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Detail View</span>
                <h2 className="text-3xl font-bold text-slate-900 mt-2">{selectedTeam.teamName}</h2>
                <p className="text-sm text-slate-500 font-medium">{selectedTeam.email}</p>
              </div>
              <button 
                onClick={() => setSelectedTeam(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <InfoItem label="PS Number" value={selectedTeam.psNumber || "N/A"} />
                <InfoItem label="Selection" value={selectedTeam.status} />
                <InfoItem label="Attendance" value={selectedTeam.attendance ? "CONFIRMED" : "AWAITING"} />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evaluator Feedback</label>
                {selectedTeam.evaluation ? (
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {selectedTeam.evaluation.evaluator.username[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{selectedTeam.evaluation.evaluator.username.toUpperCase()}</span>
                    </div>
                    <p className="text-slate-600 italic leading-relaxed">&quot;{selectedTeam.evaluation.comments}&quot;</p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-sm py-4 border-2 border-dashed border-slate-100 rounded-xl text-center">No review submitted yet.</p>
                )}
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedTeam(null)}
                className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
              <a 
                href={`https://drive.google.com/file/d/${selectedTeam.driveFileId}/view`} 
                target="_blank"
                className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-all"
              >
                View in Drive
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{label}</label>
      <p className="text-sm font-bold text-slate-700">{value}</p>
    </div>
  )
}
