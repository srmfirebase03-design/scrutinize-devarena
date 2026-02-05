"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SyncForm() {
  const [loading, setLoading] = useState(false)
  const [folderId, setFolderId] = useState("")
  const router = useRouter()

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folderId) {
      alert("Please provide Folder ID")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      })
      if (res.ok) {
        alert("Sync Completed using internal hackathon.csv!")
        router.refresh()
      } else {
        alert("Sync Failed")
      }
    } catch (err) {
      alert("Error syncing")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center gap-4">
      <div className="flex-1 space-y-1">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Drive Folder ID</label>
        <input 
          type="text" 
          placeholder="Paste ID here..." 
          className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
          value={folderId}
          onChange={e => setFolderId(e.target.value)}
        />
      </div>

      <button
        onClick={handleSync}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400 transition-all"
      >
        {loading ? "SYNCING..." : "SYNC DRIVE"}
      </button>
    </div>
  )
}
