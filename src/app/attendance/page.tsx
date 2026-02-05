"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function AttendanceContent() {
  const searchParams = useSearchParams()
  const teamId = searchParams.get("teamId")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [teamName, setTeamName] = useState("")

  useEffect(() => {
    if (teamId) {
      // Just to fetch team name for better UI
      fetch(`/api/team-info?id=${teamId}`)
        .then(res => res.json())
        .then(data => setTeamName(data.name))
    }
  }, [teamId])

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      })
      if (res.ok) setSuccess(true)
    } catch (err) {
      alert("Error confirming attendance")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center p-12 bg-white shadow-2xl rounded-2xl border border-green-100">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">You&apos;re In!</h1>
        <p className="text-lg text-gray-600 mb-6">
          Attendance confirmed for <span className="font-bold text-blue-600">{teamName}</span>.
        </p>
        <div className="py-2 px-4 bg-green-50 text-green-700 text-sm font-bold rounded-full inline-block">
          See you at the Hackathon!
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-10 bg-white shadow-2xl rounded-2xl border">
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-blue-50 rounded-xl mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Final Confirmation</h1>
        <p className="text-gray-500 mt-2">Team: <span className="font-bold text-gray-800">{teamName || "Loading..."}</span></p>
      </div>
      
      <p className="text-gray-600 mb-8 text-center leading-relaxed">
        Please confirm that your team will be attending the event physically. This helps us finalize the arrangements.
      </p>

      <button
        onClick={handleConfirm}
        disabled={loading || !teamId}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:bg-blue-700 hover:shadow-blue-200 transition-all active:scale-[0.98] disabled:bg-gray-400"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : "YES, WE ARE COMING!"}
      </button>
    </div>
  )
}

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <AttendanceContent />
      </Suspense>
    </div>
  )
}
