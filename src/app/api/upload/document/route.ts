import { documentProcessor } from '@/lib/document-processor';
import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const assistantId = formData.get('assistantId') as string;

    // File size limit: 2MB
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB in bytes
    const errors = [
      { condition: !file, message: 'No file provided', status: 400 },
      { condition: file && file.size > MAX_SIZE, message: 'File size exceeds 2MB limit', status: 400 },
      { condition: file && file.type !== 'application/pdf', message: 'Only PDF files are accepted', status: 400 },
      { condition: !assistantId, message: 'Assistant ID required', status: 400 }
    ];

    const foundError = errors.find(e => e.condition);
    if (foundError) {
      return NextResponse.json({ error: foundError.message }, { status: foundError.status });
    }

    let text: string;

    const loader = new WebPDFLoader(file, {
      splitPages: false // Get all content as one document
    });

    const docs = await loader.load();
    text = docs.map(doc => doc.pageContent).join('\n\n');

    const result = await documentProcessor.processDocument(
      text,
      assistantId,
      file.name,
      'pdf',
      undefined,
      file.type,
      file.size
    );

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      chunksCreated: result.chunksCreated,
      message: `Document processed successfully: ${result.chunksCreated} chunks created`,
      extractedLength: text.length
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
