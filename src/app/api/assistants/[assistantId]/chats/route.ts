import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  try {
    const { assistantId } = await params;

    if (!assistantId) {
      return NextResponse.json(
        { error: 'Assistant ID is required' },
        { status: 400 }
      );
    }

    const chatSessions = await prisma.chatSession.findMany({
      where: { assistantId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Get first message to use as chat title
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Format chat sessions with titles
    const formattedChats = chatSessions.map((session) => ({
      id: session.sessionId,
      title: session.messages[0]?.content.slice(0, 50) + '...' || 'New Chat',
      messageCount: session._count.messages,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }));

    return NextResponse.json({ chats: formattedChats });
  } catch (error) {
    console.error('Failed to fetch chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}
