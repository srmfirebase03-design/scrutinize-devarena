import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})

const drive = google.drive({ version: 'v3', auth: process.env.GOOGLE_API_KEY })

export async function listFiles(folderId: string) {
  try {
    const allFiles: any[] = []
    const visited = new Set<string>()
    
    async function scanFolder(id: string, currentFolderName?: string) {
      if (visited.has(id)) return
      visited.add(id)

      const res = await drive.files.list({
        q: `'${id}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, shortcutDetails)',
      })
      
      const files = res.data.files || []
      for (const file of files) {
        let actualId = file.id!
        let mimeType = file.mimeType!

        if (mimeType === 'application/vnd.google-apps.shortcut' && file.shortcutDetails) {
          actualId = file.shortcutDetails.targetId!
          mimeType = file.shortcutDetails.targetMimeType!
        }

        if (mimeType === 'application/vnd.google-apps.folder') {
          // If we are scanning the root level, these are our 3 main folders
          await scanFolder(actualId, (currentFolderName || file.name) ?? undefined)
        } else {
          allFiles.push({ ...file, id: actualId, mimeType, folderName: currentFolderName })
        }
      }
    }

    await scanFolder(folderId)
    return allFiles
  } catch (error) {
    console.error('Error fetching from Google Drive:', error)
    return []
  }
}

export function getEmbedUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/preview`
}
