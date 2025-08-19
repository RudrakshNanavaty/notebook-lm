import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessor } from '@/lib/document-processor';

const documentProcessor = new DocumentProcessor();

export async function POST(request: NextRequest) {
  try {
    const { text, assistantType, fileName } = await request.json();

    if (!text || !assistantType) {
      return NextResponse.json(
        { error: 'Text and assistant type required' },
        { status: 400 }
      );
    }

    const result = await documentProcessor.processDocument(
      text,
      assistantType,
      fileName || 'pasted-text'
    );

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      chunksCreated: result.chunksCreated,
      message: `Text processed successfully: ${result.chunksCreated} chunks created`
    });

  } catch (error) {
    console.error('Text upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process text' },
      { status: 500 }
    );
  }
}
