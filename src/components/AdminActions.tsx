"use client"

import { useState } from "react"
import ShortlistModal from "./ShortlistModal"

export default function AdminActions() {
  const [showModal, setShowModal] = useState(false)

  const handleExport = () => {
    window.open("/api/export-attendance", "_blank")
  }

  return (
    <>
      <div className="flex gap-4">
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          REVIEW SHORTLIST
        </button>
        
        <button
          onClick={handleExport}
          className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-all"
        >
          EXPORT ATTENDANCE
        </button>
      </div>

      {showModal && <ShortlistModal onClose={() => setShowModal(false)} />}
    </>
  )
}