// app/assistants/[assistantId]/chat/[chatId]/page.tsx
import { ChatInterface } from '@/components/chat/chat-interface';
import { prisma } from '@/lib/db';

interface PageProps {
	params: Promise<{
		assistantId: string;
		chatId: string;
	}>;
}

export default async function ChatPage({ params }: PageProps) {
	const { assistantId, chatId } = await params;

	// Fetch assistant and session data
	const [assistant, chatSession] = await Promise.all([
		prisma.assistant.findUnique({
			where: { id: assistantId }
		}),
		prisma.chatSession.findUnique({
			where: { sessionId: chatId },
			include: {
				messages: {
					orderBy: { createdAt: 'asc' }
				}
			}
		})
	]);

	// Convert messages to the format expected by ChatInterface
	const messages =
		chatSession?.messages.map(msg => ({
			id: msg.id,
			content: msg.content,
			role: msg.role as 'user' | 'assistant',
			createdAt: msg.createdAt
		})) || [];

	return (
		<div className='flex-1 min-h-0'>
			<ChatInterface
				assistantId={assistantId}
				sessionId={chatId}
				assistantName={assistant?.name}
				initialMessages={messages}
			/>
		</div>
	);
}
