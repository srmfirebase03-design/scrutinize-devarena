"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function FinalizeButton({ count }: { count: number }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFinalize = async () => {
    if (count !== 15) return
    
    if (!confirm(`⚠️ FINAL CONFIRMATION ⚠️\n\n• ${count} teams will receive ACCEPTANCE emails.\n• All other teams in your folder will receive REJECTION emails.\n\nThis action cannot be undone. Are you sure you are ready to send?`)) return

    setLoading(true)
    try {
      const res = await fetch("/api/evaluate/finalize-my-batch", { method: "POST" })
      if (res.ok) {
        alert("✅ Success! The batch process has started. Emails are being sent now.")
        router.refresh()
      } else {
        const data = await res.json()
        alert(`❌ Error: ${data.error}`)
      }
    } catch (err) {
      alert("System error")
    } finally {
      setLoading(false)
    }
  }

  const diff = 15 - count
  const isReady = count === 15
  
  let buttonText = ""
  let buttonStyle = ""

  if (loading) {
    buttonText = "SENDING EMAILS..."
    buttonStyle = "bg-slate-800 text-white cursor-wait"
  } else if (count < 15) {
    buttonText = `SELECT ${diff} MORE`
    buttonStyle = "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
  } else if (count > 15) {
    buttonText = `REMOVE ${Math.abs(diff)}`
    buttonStyle = "bg-rose-50 text-rose-500 border border-rose-200 cursor-not-allowed"
  } else {
    buttonText = "FINALIZE & SEND EMAILS"
    buttonStyle = "bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 animate-pulse"
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleFinalize}
        disabled={!isReady || loading}
        className={`w-full py-4 rounded-xl font-black text-sm tracking-widest transition-all active:scale-[0.98] ${buttonStyle}`}
      >
        {buttonText}
      </button>
      {!isReady && (
        <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-wide">
          You must have exactly 15 stars
        </p>
      )}
    </div>
  )
}