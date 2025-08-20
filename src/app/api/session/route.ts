import { RAGChain } from '@/lib/rag-chain';
import { NextRequest, NextResponse } from 'next/server';

const ragChain = new RAGChain();

export async function POST(request: NextRequest) {
  try {
    const { assistantId } = await request.json();

    if (!assistantId) {
      return NextResponse.json(
        { error: 'Assistant ID is required' },
        { status: 400 }
      );
    }

    const sessionId = await ragChain.createChatSession(assistantId);

    return NextResponse.json({
      success: true,
      sessionId
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
