import { DocumentProcessor } from '@/lib/document-processor';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { NextRequest, NextResponse } from 'next/server';

const documentProcessor = new DocumentProcessor();

export async function POST(request: NextRequest) {
  try {
    const { url, assistantId, title } = await request.json();

    if (!url || !assistantId) {
      return NextResponse.json(
        { error: 'URL and assistant ID are required' },
        { status: 400 }
      );
    }

    // Simple URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Use LangChain WebBaseLoader for better content extraction
    let pageTitle: string;
    let extractedLength: number;

    try {
      // Create the web loader with custom selector options
      const loader = new CheerioWebBaseLoader(url, {
        selector: 'main, article, .content, .post, .entry, body'
      });

      // Load the document
      const docs = await loader.load();

      if (docs.length === 0) {
        return NextResponse.json(
          { error: 'No content could be extracted from the website' },
          { status: 400 }
        );
      }

      // Get the content and title
      const content = docs[0].pageContent.trim();
      extractedLength = content.length;

      // Extract title from metadata or use provided title
      pageTitle = title || docs[0].metadata.title || url;

      if (content.length < 100) {
        return NextResponse.json(
          { error: 'Website content too short or could not extract meaningful text' },
          { status: 400 }
        );
      }

      // Process using the new loader-based method
      const result = await documentProcessor.processDocumentFromLoader(
        loader,
        assistantId,
        pageTitle,
        'website',
        url,
        'text/html',
        extractedLength
      );

      return NextResponse.json({
        success: true,
        documentId: result.documentId,
        chunksCreated: result.chunksCreated,
        message: `Website processed successfully: ${result.chunksCreated} chunks created`,
        title: pageTitle,
        extractedLength
      });

    } catch (fetchError) {
      console.error('Website fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch website content. Please check the URL.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Website upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process website' },
      { status: 500 }
    );
  }
}
