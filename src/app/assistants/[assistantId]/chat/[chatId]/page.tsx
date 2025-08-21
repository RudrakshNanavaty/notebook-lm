// app/assistants/[assistantId]/chat/[chatId]/page.tsx
import { AppSidebar } from '@/components/app-sidebar';
import { ChatInterface } from '@/components/chat/chat-interface';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger
} from '@/components/ui/sidebar';
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
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className='flex flex-col h-screen'>
				<header className='bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4'>
					<SidebarTrigger className='-ml-1' />
					<Separator orientation='vertical' className='mr-2 h-4' />
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink href='/'>Home</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem className='hidden md:block'>
								<BreadcrumbLink
									href={`/assistants/${assistantId}`}
								>
									{assistant?.name ||
										`Assistant ${assistantId}`}
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Chat {chatId}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</header>

				{/* Chat Interface takes full remaining height */}
				<div className='flex-1 min-h-0'>
					<ChatInterface
						assistantId={assistantId}
						sessionId={chatId}
						assistantName={assistant?.name}
						initialMessages={messages}
					/>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
