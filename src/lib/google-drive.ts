// ========================================
// src/lib/google-drive.ts - Service Google Drive
// ========================================

import { google } from 'googleapis'

// Configuration Google Drive
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || 'CV_Connect_Folder_ID'
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
  ?.replace(/\\n/g, '\n')
  ?.replace(/^"/, '')
  ?.replace(/"$/, '')
  ?.trim()

// Initialiser l'authentification Google Drive
const getGoogleDriveAuth = () => {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Configuration Google Drive manquante')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  return auth
}

// Obtenir le service Google Drive
const getDriveService = () => {
  const auth = getGoogleDriveAuth()
  return google.drive({ version: 'v3', auth })
}

// Créer un dossier sur Google Drive
export const createFolder = async (folderName: string, parentFolderId?: string): Promise<string> => {
  try {
    const drive = getDriveService()
    
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : [GOOGLE_DRIVE_FOLDER_ID],
    }

    const response = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    })

    return response.data.id || ''
  } catch (error) {
    console.error('Erreur création dossier Google Drive:', error)
    throw new Error('Impossible de créer le dossier sur Google Drive')
  }
}

// Vérifier si un dossier existe
export const folderExists = async (folderName: string, parentFolderId?: string): Promise<string | null> => {
  try {
    const drive = getDriveService()
    
    const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    const parentQuery = parentFolderId ? ` and '${parentFolderId}' in parents` : ` and '${GOOGLE_DRIVE_FOLDER_ID}' in parents`
    
    const response = await drive.files.list({
      q: query + parentQuery,
      fields: 'files(id, name)',
    })

    const folders = response.data.files || []
    return folders.length > 0 ? folders[0].id || null : null
  } catch (error) {
    console.error('Erreur vérification dossier Google Drive:', error)
    return null
  }
}

// Obtenir ou créer un dossier
export const getOrCreateFolder = async (folderName: string, parentFolderId?: string): Promise<string> => {
  try {
    // Vérifier si le dossier existe
    const existingFolderId = await folderExists(folderName, parentFolderId)
    
    if (existingFolderId) {
      return existingFolderId
    }
    
    // Créer le dossier s'il n'existe pas
    return await createFolder(folderName, parentFolderId)
  } catch (error) {
    console.error('Erreur getOrCreateFolder:', error)
    throw error
  }
}

// Uploader un fichier sur Google Drive
export const uploadFile = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  parentFolderId: string
): Promise<{ fileId: string; webViewLink: string }> => {
  try {
    // Validation du buffer
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Le fichier est vide ou invalide')
    }

    const drive = getDriveService()
    
    // Inclure le mimeType dans les métadonnées du fichier
    const fileMetadata = {
      name: fileName,
      parents: [parentFolderId],
      mimeType: mimeType,
    }

    // Uploader directement depuis le buffer (plus efficace et fiable)
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: mimeType,
        body: fileBuffer,
      },
      fields: 'id, webViewLink, size',
    })

    // Vérifier que l'upload a réussi et que le fichier a une taille valide
    if (!response.data.id) {
      throw new Error('L\'upload a échoué : aucun ID de fichier retourné')
    }

    const uploadedFileSize = response.data.size ? parseInt(response.data.size) : 0
    if (uploadedFileSize === 0) {
      throw new Error('Le fichier uploadé est vide (0 ko)')
    }

    console.log(`Fichier uploadé avec succès : ${fileName} (${uploadedFileSize} bytes)`)

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink || '',
    }
  } catch (error: any) {
    console.error('Erreur upload fichier Google Drive:', error)
    const errorMessage = error.message || 'Impossible d\'uploader le fichier sur Google Drive'
    throw new Error(errorMessage)
  }
}

// Créer la structure de dossiers pour un CV
export const createCVFolderStructure = async (poleName: string, filiereName: string): Promise<string> => {
  try {
    // Créer le dossier du pôle s'il n'existe pas
    const poleFolderId = await getOrCreateFolder(poleName)
    
    // Créer le dossier de la filière dans le pôle
    const filiereFolderId = await getOrCreateFolder(filiereName, poleFolderId)
    
    return filiereFolderId
  } catch (error) {
    console.error('Erreur création structure dossiers:', error)
    throw error
  }
}

// Uploader un CV avec structure automatique
export const uploadCV = async (
  fileBuffer: Buffer,
  fileName: string,
  poleName: string,
  filiereName: string
): Promise<{ fileId: string; webViewLink: string; folderPath: string }> => {
  try {
    // Créer la structure de dossiers
    const folderId = await createCVFolderStructure(poleName, filiereName)
    
    // Uploader le fichier
    const uploadResult = await uploadFile(fileBuffer, fileName, 'application/pdf', folderId)
    
    return {
      ...uploadResult,
      folderPath: `${poleName}/${filiereName}`,
    }
  } catch (error) {
    console.error('Erreur upload CV:', error)
    throw error
  }
}

// Supprimer un fichier
export const deleteFile = async (fileId: string): Promise<boolean> => {
  try {
    const drive = getDriveService()
    
    await drive.files.delete({
      fileId,
    })
    
    return true
  } catch (error) {
    console.error('Erreur suppression fichier Google Drive:', error)
    return false
  }
}

// Obtenir les informations d'un fichier
export const getFileInfo = async (fileId: string) => {
  try {
    const drive = getDriveService()
    
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, size, createdTime, webViewLink, parents',
    })
    
    return response.data
  } catch (error) {
    console.error('Erreur récupération info fichier:', error)
    return null
  }
}

// Lister les fichiers d'un dossier
export const listFolderFiles = async (folderId: string) => {
  try {
    const drive = getDriveService()
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, size, createdTime, webViewLink)',
    })
    
    return response.data.files || []
  } catch (error) {
    console.error('Erreur liste fichiers dossier:', error)
    return []
  }
}
