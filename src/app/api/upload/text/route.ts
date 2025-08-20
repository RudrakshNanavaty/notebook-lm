import { DocumentProcessor } from '@/lib/document-processor';
import { NextRequest, NextResponse } from 'next/server';

const documentProcessor = new DocumentProcessor();

export async function POST(request: NextRequest) {
  try {
    const { text, assistantId, fileName, sourceUrl } = await request.json();

    if (!text || !assistantId) {
      return NextResponse.json(
        { error: 'Text and assistant ID are required' },
        { status: 400 }
      );
    }

    const result = await documentProcessor.processDocument(
      text,
      assistantId,
      fileName || 'pasted-text',
      sourceUrl ? 'website' : 'pdf',
      sourceUrl
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
