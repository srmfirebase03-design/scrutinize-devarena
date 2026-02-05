"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function EvaluationPanel({ team }: { team: any }) {
  // Initialize state with the team's CURRENT values from the DB
  const [comment, setComment] = useState(team.comments || "")
  const [isStarred, setIsStarred] = useState(team.isStarred || false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const wordCount = comment.trim().split(/\s+/).filter(Boolean).length

  const handleSubmit = async () => {
    if (wordCount < 10) return alert("Comments must be at least 10 words")

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id, comment, isStarred }),
      })

      if (res.ok) {
        // Wait a brief moment for server-side revalidation, then refresh
        await new Promise(resolve => setTimeout(resolve, 300))
        router.refresh()
        setLoading(false)
      } else {
        const errorData = await res.json()
        setError(errorData.error || "Save failed - please retry")
        setLoading(false)
      }
    } catch (err) {
      setError("Error submitting - please check your connection")
      setLoading(false)
    }
  }

  const embedUrl = `https://drive.google.com/file/d/` + team.driveFileId + `/preview`

  return (
    <div className="w-full min-h-full bg-slate-50 relative">
      
      {/* PROFESSIONAL LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Saving Review...</span>
          </div>
        </div>
      )}

      {/* 1. PRESENTATION STAGE */}
      <div className="relative w-full h-[90vh] bg-black flex flex-col items-center justify-center border-b border-slate-900 group">
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen"
        />
        
        <div className="absolute top-0 left-0 p-6 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
           <div className="bg-black/80 text-white p-4 rounded-lg backdrop-blur-md border border-white/10 shadow-2xl">
             <h1 className="text-xl font-bold">{team.teamName}</h1>
             <p className="text-sm font-mono text-gray-300 mt-1">{team.psNumber}</p>
           </div>
        </div>

        <div className="absolute bottom-6 flex flex-col items-center gap-2 pointer-events-none animate-bounce">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur">
            Scroll to Review
          </span>
          <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* 2. SHORTLISTING CONSOLE */}
      <div className="w-full bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] pb-24 relative z-10">
        <div className="max-w-4xl mx-auto p-10">
          
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Update Review</h2>
              <p className="text-sm text-slate-500 mt-1 italic">Reviewing <span className="font-bold text-indigo-600">{team.teamName}</span></p>
            </div>
            <div className={`text-xs font-black px-4 py-2 rounded-full border-2 transition-colors ${
              wordCount >= 10 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : 'bg-rose-50 text-rose-500 border-rose-100'
            }`}>
              {wordCount} / 10 WORDS
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

            {/* Left: Star Toggle */}
            <div className="md:col-span-5 space-y-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Shortlist for Top 15</label>

              <button
                onClick={() => setIsStarred(!isStarred)}
                className={`w-full relative group p-8 rounded-3xl border-2 transition-all duration-500 flex flex-col items-center justify-center gap-4 text-center ${
                  isStarred
                    ? 'bg-indigo-600 border-indigo-600 shadow-2xl shadow-indigo-200 ring-4 ring-indigo-600/10'
                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isStarred ? 'bg-white/20 scale-110 rotate-12 shadow-inner' : 'bg-slate-50'}`}>
                  <svg className={`w-10 h-10 ${isStarred ? 'text-yellow-300 fill-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]' : 'text-slate-200'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>

                <div>
                  <span className={`block text-xl font-black tracking-tight ${isStarred ? 'text-white' : 'text-slate-800'}`}>
                    {isStarred ? "STARRED" : "NOT STARRED"}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isStarred ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {isStarred ? "Click to Remove" : "Click to Shortlist"}
                  </span>
                </div>
              </button>
            </div>

            {/* Right: Feedback */}
            <div className="md:col-span-7 space-y-6 flex flex-col">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Evaluator Feedback</label>
              <textarea
                className="flex-1 w-full p-8 text-base text-slate-900 bg-slate-50/50 border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none shadow-inner font-medium leading-relaxed"
                placeholder="Technical implementation, presentation quality, and general notes..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ minHeight: '280px' }}
              />
            </div>
          </div>

          <div className="mt-12 pt-10 border-t border-slate-100 flex justify-between items-center gap-6">
            <div className="flex-1">
              {error && (
                <div className="text-sm font-semibold text-rose-600 bg-rose-50 px-4 py-3 rounded-lg border border-rose-100">
                  {error}
                </div>
              )}
              {!error && (
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Auto-syncing to cloud</span>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || wordCount < 10}
              className="group relative px-12 py-5 bg-slate-900 text-white font-black text-lg rounded-2xl shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-20"
            >
              {loading ? "SAVING..." : "UPDATE REVIEW"}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}