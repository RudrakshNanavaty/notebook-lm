'use client';

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
	}>;
}

export default async function AssistantPage({ params }: PageProps) {
	const { assistantId } = await params;
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
							<BreadcrumbItem>
								<BreadcrumbPage>
									Assistant {assistantId}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</header>
				<div className='flex flex-1 flex-col gap-4 p-4'>
					<div className='bg-muted/50 rounded-lg p-6'>
						<h1 className='text-2xl font-bold mb-4'>
							Assistant {assistantId}
						</h1>
						<p className='text-muted-foreground'>
							Select a chat from the sidebar or create a new one
							to start chatting with this assistant.
						</p>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
