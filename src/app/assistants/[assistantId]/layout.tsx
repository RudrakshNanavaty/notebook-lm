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
import React from 'react';

interface LayoutProps {
	children: React.ReactNode;
	params: Promise<{ assistantId: string }>;
	breadcrumb?: React.ReactNode;
}

export default async function AssistantLayout({
	children,
	params,
	breadcrumb
}: LayoutProps) {
	const { assistantId } = await params;
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className='flex flex-col h-screen'>
				<header className='bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4'>
					<SidebarTrigger className='-ml-1' />
				</header>
				<div className='flex-1 min-h-0 flex flex-col gap-4 p-4'>
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
