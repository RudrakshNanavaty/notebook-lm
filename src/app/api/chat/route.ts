// app/api/chat/route.ts
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

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use the new streaming method
          const streamGenerator = ragChain.queryRAGStream(message, assistantId, sessionId);

          for await (const chunk of streamGenerator) {
            if (chunk.done) {
              // Send completion signal
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`)
              );
              break;
            }

            if (chunk.content) {
              const payload = JSON.stringify({
                content: chunk.content,
                retrievedDocs: chunk.retrievedDocs
              });

              controller.enqueue(
                new TextEncoder().encode(`data: ${payload}\n\n`)
              );
            }
          }

          controller.close();

        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              error: "Failed to generate response",
              done: true
            })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
