import { NextRequest, NextResponse } from 'next/server';
import { RAGChain } from '@/lib/rag-chain';

const ragChain = new RAGChain();

export async function POST(request: NextRequest) {
  try {
    const { message, assistantType, sessionId } = await request.json();

    if (!message || !assistantType) {
      return NextResponse.json(
        { error: 'Message and assistant type required' },
        { status: 400 }
      );
    }

    const result = await ragChain.queryRAG(message, assistantType, sessionId);

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
