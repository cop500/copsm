import { NextRequest, NextResponse } from 'next/server';
import { generateEmployabilityPPTX } from '@/utils/pptxGenerator';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Générer le PowerPoint
    const pptx = await generateEmployabilityPPTX(data);
    
    // Générer le nom du fichier
    const fileName = `Bilan_Employabilite_COP_${new Date().toISOString().split('T')[0]}.pptx`;
    
    // Générer le buffer
    const buffer = await pptx.write('nodebuffer');
    
    // Retourner le fichier
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PowerPoint:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PowerPoint' },
      { status: 500 }
    );
  }
}
