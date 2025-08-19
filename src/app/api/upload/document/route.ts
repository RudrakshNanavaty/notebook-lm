import { DocumentProcessor } from '@/lib/document-processor';
import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';
import { NextRequest, NextResponse } from 'next/server';

const documentProcessor = new DocumentProcessor();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const assistantType = formData.get('assistantType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!assistantType) {
      return NextResponse.json({ error: 'Assistant type required' }, { status: 400 });
    }

    let text: string;

    if (file.type === 'application/pdf') {
      // Use WebPDFLoader - much cleaner!
      const loader = new WebPDFLoader(file, {
        splitPages: false // Get all content as one document
      });

      const docs = await loader.load();
      text = docs.map(doc => doc.pageContent).join('\n\n');

    } else {
      text = await file.text();
    }

    const result = await documentProcessor.processDocument(
      text,
      assistantType,
      file.name
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
