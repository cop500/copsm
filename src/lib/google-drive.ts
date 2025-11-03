// ========================================
// src/lib/google-drive.ts - Service Google Drive
// ========================================

import { google } from 'googleapis'
import { Readable } from 'stream'

// Configuration Google Drive
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || 'CV_Connect_Folder_ID'
// Si GOOGLE_DRIVE_FOLDER_ID est un Shared Drive, utiliser driveId dans les requêtes
const GOOGLE_DRIVE_ID = process.env.GOOGLE_DRIVE_ID || process.env.GOOGLE_DRIVE_FOLDER_ID
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
  ?.replace(/\\n/g, '\n')
  ?.replace(/^"/, '')
  ?.replace(/"$/, '')
  ?.trim()

// Initialiser l'authentification Google Drive
const getGoogleDriveAuth = () => {
  console.log('[Google Drive Auth] Vérification configuration...')
  
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    console.error('[Google Drive Auth] ❌ GOOGLE_SERVICE_ACCOUNT_EMAIL manquant')
    throw new Error('Configuration Google Drive manquante: GOOGLE_SERVICE_ACCOUNT_EMAIL non défini')
  }
  
  if (!GOOGLE_PRIVATE_KEY) {
    console.error('[Google Drive Auth] ❌ GOOGLE_PRIVATE_KEY manquant')
    throw new Error('Configuration Google Drive manquante: GOOGLE_PRIVATE_KEY non défini')
  }

  console.log('[Google Drive Auth] ✅ Configuration présente')
  console.log('[Google Drive Auth] Email:', GOOGLE_SERVICE_ACCOUNT_EMAIL)
  console.log('[Google Drive Auth] Clé privée:', GOOGLE_PRIVATE_KEY ? `${GOOGLE_PRIVATE_KEY.substring(0, 20)}...` : 'Non définie')

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    })

    console.log('[Google Drive Auth] ✅ Authentification créée avec succès')
    return auth
  } catch (error: any) {
    console.error('[Google Drive Auth] ❌ Erreur lors de la création de l\'authentification:', error.message)
    throw new Error(`Erreur d'authentification Google Drive: ${error.message}`)
  }
}

// Obtenir le service Google Drive
const getDriveService = () => {
  const auth = getGoogleDriveAuth()
  return google.drive({ version: 'v3', auth })
}

// Créer un dossier sur Google Drive
export const createFolder = async (folderName: string, parentFolderId?: string): Promise<string> => {
  try {
    const targetParentId = parentFolderId || GOOGLE_DRIVE_FOLDER_ID
    console.log(`[Google Drive] Création dossier: "${folderName}" dans ${targetParentId}`)
    const drive = getDriveService()
    
    // Vérifier d'abord si le parent existe et est accessible
    try {
      const parentInfo = await drive.files.get({
        fileId: targetParentId,
        fields: 'id, name, mimeType, driveId, capabilities',
        supportsAllDrives: true,
        supportsTeamDrives: true,
      })
      
      console.log(`[Google Drive] ✅ Parent accessible:`, {
        id: parentInfo.data.id,
        name: parentInfo.data.name,
        mimeType: parentInfo.data.mimeType,
        driveId: parentInfo.data.driveId
      })
    } catch (accessError: any) {
      console.error(`[Google Drive] ❌ Impossible d'accéder au parent ${targetParentId}:`, accessError.message)
      
      // Si c'est une erreur "not found", fournir des instructions
      if (accessError.code === 404 || accessError.message.includes('not found')) {
        throw new Error(
          `Le dossier parent (${targetParentId}) est introuvable ou inaccessible. ` +
          `Vérifiez que : 1) Le Service Account est membre du Shared Drive, ` +
          `2) L'ID est correct, ` +
          `3) Les permissions sont suffisantes (Gestionnaire de contenu minimum). ` +
          `Erreur technique: ${accessError.message}`
        )
      }
      throw accessError
    }
    
    const folderMetadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [targetParentId],
    }

    // Si on utilise un Shared Drive, ajouter driveId
    const requestOptions: any = {
      requestBody: folderMetadata,
      fields: 'id',
      supportsAllDrives: true,
      supportsTeamDrives: true,
    }

    // Si GOOGLE_DRIVE_ID est défini et différent du parent, c'est probablement un Shared Drive
    if (GOOGLE_DRIVE_ID && GOOGLE_DRIVE_ID === GOOGLE_DRIVE_FOLDER_ID && !parentFolderId) {
      requestOptions.driveId = GOOGLE_DRIVE_ID
    }

    const response = await drive.files.create(requestOptions)

    const folderId = response.data.id || ''
    console.log(`[Google Drive] ✅ Dossier créé: "${folderName}" (ID: ${folderId})`)
    return folderId
  } catch (error: any) {
    console.error('[Google Drive] ❌ Erreur création dossier:', {
      folderName,
      parentFolderId,
      message: error.message,
      code: error.code,
      errors: error.errors
    })
    throw new Error(`Impossible de créer le dossier "${folderName}" sur Google Drive: ${error.message}`)
  }
}

// Vérifier si un dossier existe
export const folderExists = async (folderName: string, parentFolderId?: string): Promise<string | null> => {
  try {
    const drive = getDriveService()
    
    const targetParentId = parentFolderId || GOOGLE_DRIVE_FOLDER_ID
    const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    const parentQuery = ` and '${targetParentId}' in parents`
    
    const requestOptions: any = {
      q: query + parentQuery,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      supportsTeamDrives: true,
      includeItemsFromAllDrives: true,
    }

    // Si on utilise un Shared Drive, ajouter driveId
    if (GOOGLE_DRIVE_ID && GOOGLE_DRIVE_ID === GOOGLE_DRIVE_FOLDER_ID && !parentFolderId) {
      requestOptions.driveId = GOOGLE_DRIVE_ID
    }
    
    const response = await drive.files.list(requestOptions)

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
    console.log(`[Google Drive] getOrCreateFolder: "${folderName}"`)
    // Vérifier si le dossier existe
    const existingFolderId = await folderExists(folderName, parentFolderId)
    
    if (existingFolderId) {
      console.log(`[Google Drive] ✅ Dossier existant trouvé: "${folderName}" (ID: ${existingFolderId})`)
      return existingFolderId
    }
    
    // Créer le dossier s'il n'existe pas
    console.log(`[Google Drive] Dossier n'existe pas, création en cours...`)
    return await createFolder(folderName, parentFolderId)
  } catch (error: any) {
    console.error('[Google Drive] ❌ Erreur getOrCreateFolder:', {
      folderName,
      parentFolderId,
      message: error.message,
      code: error.code,
      errors: error.errors
    })
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

    console.log(`[Google Drive] Début upload: ${fileName} (${fileBuffer.length} bytes) vers dossier ${parentFolderId}`)

    const drive = getDriveService()
    
    // Inclure le mimeType dans les métadonnées du fichier
    const fileMetadata = {
      name: fileName,
      parents: [parentFolderId],
      mimeType: mimeType,
    }

    console.log(`[Google Drive] Métadonnées du fichier:`, { name: fileName, mimeType, parentId: parentFolderId })

    // Convertir le Buffer en stream Readable pour compatibilité avec googleapis
    // En production (serverless), googleapis peut avoir besoin d'un stream plutôt qu'un Buffer direct
    const bufferStream = new Readable()
    bufferStream.push(fileBuffer)
    bufferStream.push(null) // Signal de fin

    // Uploader depuis le stream (compatible avec tous les environnements)
    // Important: Utiliser supportsAllDrives et supportsTeamDrives pour les Shared Drives
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: mimeType,
        body: bufferStream,
      },
      fields: 'id, webViewLink, size, name',
      supportsAllDrives: true,
      supportsTeamDrives: true,
    })

    console.log(`[Google Drive] Réponse API:`, {
      id: response.data.id,
      name: response.data.name,
      size: response.data.size,
      hasWebViewLink: !!response.data.webViewLink
    })

    // Vérifier que l'upload a réussi et que le fichier a une taille valide
    if (!response.data.id) {
      throw new Error('L\'upload a échoué : aucun ID de fichier retourné')
    }

    const uploadedFileSize = response.data.size ? parseInt(response.data.size) : 0
    if (uploadedFileSize === 0) {
      throw new Error('Le fichier uploadé est vide (0 ko)')
    }

    if (!response.data.webViewLink) {
      console.warn(`[Google Drive] Aucun webViewLink retourné, génération d'une URL alternative`)
      // Générer une URL alternative si webViewLink n'est pas disponible
      const alternativeUrl = `https://drive.google.com/file/d/${response.data.id}/view`
      console.log(`[Google Drive] URL alternative: ${alternativeUrl}`)
      
      return {
        fileId: response.data.id,
        webViewLink: alternativeUrl,
      }
    }

    // Rendre le fichier accessible (partager avec le domaine ou les utilisateurs ayant accès au dossier parent)
    try {
      // Partager le fichier avec "anyone with the link" pour garantir l'accessibilité
      await drive.permissions.create({
        fileId: response.data.id!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
        supportsTeamDrives: true,
      })
      console.log(`[Google Drive] Permissions définies pour le fichier ${response.data.id}`)
    } catch (permissionError: any) {
      console.warn(`[Google Drive] Impossible de définir les permissions (non bloquant):`, permissionError.message)
      // Ne pas bloquer si les permissions échouent, le fichier peut quand même être accessible via le dossier parent
    }

    console.log(`[Google Drive] ✅ Fichier uploadé avec succès : ${fileName} (${uploadedFileSize} bytes)`)

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink || '',
    }
  } catch (error: any) {
    console.error('[Google Drive] ❌ Erreur détaillée:', {
      message: error.message,
      code: error.code,
      errors: error.errors,
      stack: error.stack
    })
    const errorMessage = error.message || 'Impossible d\'uploader le fichier sur Google Drive'
    throw new Error(errorMessage)
  }
}

// Créer la structure de dossiers pour un CV
export const createCVFolderStructure = async (poleName: string, filiereName: string): Promise<string> => {
  try {
    console.log(`[Google Drive] Création structure dossiers: ${poleName}/${filiereName}`)
    
    // Créer le dossier du pôle s'il n'existe pas
    console.log(`[Google Drive] Recherche/création dossier pôle: ${poleName}`)
    const poleFolderId = await getOrCreateFolder(poleName)
    console.log(`[Google Drive] ✅ Dossier pôle créé/trouvé: ${poleFolderId}`)
    
    // Créer le dossier de la filière dans le pôle
    console.log(`[Google Drive] Recherche/création dossier filière: ${filiereName} (dans ${poleFolderId})`)
    const filiereFolderId = await getOrCreateFolder(filiereName, poleFolderId)
    console.log(`[Google Drive] ✅ Dossier filière créé/trouvé: ${filiereFolderId}`)
    
    return filiereFolderId
  } catch (error: any) {
    console.error('[Google Drive] ❌ Erreur création structure dossiers:', {
      message: error.message,
      code: error.code,
      errors: error.errors,
      stack: error.stack
    })
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
      supportsAllDrives: true,
      supportsTeamDrives: true,
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
      supportsAllDrives: true,
      supportsTeamDrives: true,
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
      supportsAllDrives: true,
      supportsTeamDrives: true,
      includeItemsFromAllDrives: true,
    })
    
    return response.data.files || []
  } catch (error) {
    console.error('Erreur liste fichiers dossier:', error)
    return []
  }
}
