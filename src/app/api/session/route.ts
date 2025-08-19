import { NextRequest, NextResponse } from 'next/server';
import { RAGChain } from '@/lib/rag-chain';

const ragChain = new RAGChain();

export async function POST(request: NextRequest) {
  try {
    const { assistantType } = await request.json();

    if (!assistantType) {
      return NextResponse.json(
        { error: 'Assistant type required' },
        { status: 400 }
      );
    }

    const sessionId = await ragChain.createChatSession(assistantType);

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
