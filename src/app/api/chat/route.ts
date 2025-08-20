import { RAGChain } from '@/lib/rag-chain';
import { NextRequest, NextResponse } from 'next/server';

const ragChain = new RAGChain();

export async function POST(request: NextRequest) {
  try {
    const { message, assistantId, sessionId } = await request.json();

    if (!message || !assistantId) {
      return NextResponse.json(
        { error: 'Message and assistant ID are required' },
        { status: 400 }
      );
    }

    const result = await ragChain.queryRAG(message, assistantId, sessionId);

    return NextResponse.json({
      success: true,
      response: result.response,
      retrievedDocs: result.retrievedDocs,
      sessionId
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
