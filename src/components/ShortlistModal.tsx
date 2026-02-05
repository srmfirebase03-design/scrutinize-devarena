"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ShortlistModal({ onClose }: { onClose: () => void }) {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/shortlist')
      .then(res => res.json())
      .then(data => {
        setTeams(data)
        setLoading(false)
      })
  }, [])

  const handleFinalize = async () => {
    if (!confirm(`Are you sure? This will send ACCEPTANCE emails to these ${teams.length} teams and REJECTION emails to everyone else.`)) return

    setProcessing(true)
    try {
      const res = await fetch("/api/finalize", { method: "POST" })
      if (res.ok) {
        alert("Batch process started! Emails are sending.")
        router.refresh()
        onClose()
      } else {
        alert("Error starting batch process.")
      }
    } catch (err) {
      alert("System error")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Final Shortlist Review</h2>
            <p className="text-sm text-slate-500 mt-1">
              Teams marked with <span className="text-yellow-500 font-bold">★ STAR</span> by evaluators.
            </p>
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Selected</span>
            <span className={`text-3xl font-black ${teams.length > 40 ? 'text-rose-500' : 'text-emerald-600'}`}>
              {teams.length} <span className="text-lg text-slate-300">/ 40</span>
            </span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="p-10 text-center text-slate-400">Loading shortlist...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b">Team</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b">Score</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b">Evaluator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{team.teamName}</div>
                      <div className="text-xs text-slate-400">{team.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {team.score}/10
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {team.evaluation?.evaluator?.username || "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleFinalize}
            disabled={processing || loading}
            className={`px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all ${
              teams.length > 40 ? 'bg-rose-600 hover:bg-rose-700' : ''
            }`}
          >
            {processing ? "SENDING EMAILS..." : `CONFIRM & SEND (${teams.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
