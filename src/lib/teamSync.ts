import Papa from 'papaparse'
import fs from 'fs'
import path from 'path'

export async function getTeamsFromInternalCSV() {
  const csvFilePath = path.join(process.cwd(), 'public/data/hackathon.csv')
  const csvContent = fs.readFileSync(csvFilePath, 'utf8')
  
  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true })
  const data = parsed.data as any[]

  const results = []
  for (const row of data) {
    const teamName = row['TEAM NAME']
    const email = row['EMAIL ID']

    if (teamName && email) {
      results.push({ teamName: teamName.trim(), email: email.trim() })
    }
  }
  return results
}

export function parseFileName(fileName: string) {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "")
  const parts = nameWithoutExt.split('_')
  
  if (parts.length >= 2) {
    const psNumber = parts[0].trim()
    const teamName = parts.slice(1).join('_').trim()
    return { psNumber, teamName }
  }
  return null
}