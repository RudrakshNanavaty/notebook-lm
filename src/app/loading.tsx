// app/loading.tsx
import { AppSidebar } from '@/components/app-sidebar';
import { ChatLoadingSkeleton } from '@/components/chat/chat-skeleton';
import {
	Breadcrumb,
	BreadcrumbItem,
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
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
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
								<Skeleton className='h-4 w-12' />
							</BreadcrumbItem>
							<BreadcrumbSeparator className='hidden md:block' />
							<BreadcrumbItem>
								<BreadcrumbPage>
									<Skeleton className='h-4 w-20' />
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</header>
				<div className='flex flex-1 flex-col'>
					<ChatLoadingSkeleton />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
