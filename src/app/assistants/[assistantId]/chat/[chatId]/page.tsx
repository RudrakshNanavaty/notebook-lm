import { AppSidebar } from '@/components/app-sidebar';
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

interface PageProps {
	params: Promise<{
		assistantId: string;
		chatId: string;
	}>;
}

export default async function ChatPage({ params }: PageProps) {
	const { assistantId, chatId } = await params;
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className='bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4'>
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
									Assistant {assistantId}
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>Chat {chatId}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</header>
				<div className='flex flex-1 flex-col gap-4 p-4'>
					<div className='bg-muted/50 rounded-lg p-6'>
						<h1 className='text-2xl font-bold mb-4'>
							Chat Session
						</h1>
						<div className='space-y-2'>
							<p>
								<strong>Assistant ID:</strong> {assistantId}
							</p>
							<p>
								<strong>Chat ID:</strong> {chatId}
							</p>
							<p className='text-muted-foreground mt-4'>
								This is a placeholder for the chat interface.
								The navigation is working correctly if you can
								see the assistant and chat IDs above, and the
								sidebar shows this chat as active.
							</p>
						</div>
					</div>
					<div className='bg-green-50 border border-green-200 rounded-lg p-4'>
						<h2 className='text-lg font-semibold text-green-800 mb-2'>
							✅ Navigation Test
						</h2>
						<p className='text-green-700'>
							If you can see this page and the correct IDs above,
							the navigation is working properly! The sidebar
							should highlight this chat as active.
						</p>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
