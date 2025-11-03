import { NextResponse } from 'next/server'

export async function GET() {
  const diagnostics = {
    environment: process.env.NODE_ENV,
    variables: {
      GOOGLE_DRIVE_FOLDER_ID: {
        defined: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
        value: process.env.GOOGLE_DRIVE_FOLDER_ID ? `${process.env.GOOGLE_DRIVE_FOLDER_ID.substring(0, 20)}...` : 'NON DÉFINI',
        length: process.env.GOOGLE_DRIVE_FOLDER_ID?.length || 0
      },
      GOOGLE_SERVICE_ACCOUNT_EMAIL: {
        defined: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        value: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL : 'NON DÉFINI',
        length: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.length || 0
      },
      GOOGLE_PRIVATE_KEY: {
        defined: !!process.env.GOOGLE_PRIVATE_KEY,
        value: process.env.GOOGLE_PRIVATE_KEY ? `${process.env.GOOGLE_PRIVATE_KEY.substring(0, 30)}...` : 'NON DÉFINI',
        length: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
        startsWithBEGIN: process.env.GOOGLE_PRIVATE_KEY?.startsWith('-----BEGIN') || false
      }
    },
    status: {
      allConfigured: !!(
        process.env.GOOGLE_DRIVE_FOLDER_ID &&
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
        process.env.GOOGLE_PRIVATE_KEY
      ),
      readyToTest: false
    }
  }

  // Vérifier si la clé privée a le bon format
  if (diagnostics.variables.GOOGLE_PRIVATE_KEY.defined) {
    const key = process.env.GOOGLE_PRIVATE_KEY || ''
    diagnostics.variables.GOOGLE_PRIVATE_KEY.startsWithBEGIN = key.startsWith('-----BEGIN')
    
    // Vérifier si la clé contient des \n littéraux (problème courant)
    if (key.includes('\\n')) {
      diagnostics.variables.GOOGLE_PRIVATE_KEY.hasLiteralNewlines = true
    }
  }

  diagnostics.status.readyToTest = diagnostics.status.allConfigured && 
    diagnostics.variables.GOOGLE_PRIVATE_KEY.startsWithBEGIN

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  })
}

