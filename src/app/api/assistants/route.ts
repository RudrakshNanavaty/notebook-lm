import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const assistants = await prisma.assistant.findMany({
      include: {
        documents: {
          where: { status: 'completed' },
          select: {
            id: true,
            fileName: true,
            chunks: true,
            uploadedAt: true
          }
        },
        _count: {
          select: {
            documents: true,
            chatSessions: true
          }
        }
      }
    });

    return NextResponse.json({ assistants });
  } catch (error) {
    console.error('Failed to fetch assistants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assistants' },
      { status: 500 }
    );
  }
}
