'use client';

import { ChevronRight } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { SearchForm } from '@/components/search-form';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail
} from '@/components/ui/sidebar';
import { VersionSwitcher } from '@/components/version-switcher';
import { Button } from './ui/button';

// Types for our data structure
interface Chat {
	id: string;
	title: string;
	messageCount: number;
	createdAt: string;
	updatedAt: string;
}

interface Assistant {
	id: string;
	name: string;
	description: string;
	_count: {
		documents: number;
		chatSessions: number;
	};
}

interface NavItem {
	title: string;
	url: string;
	items: {
		title: string;
		url: string;
		isActive?: boolean;
	}[];
}

// Hook to fetch assistants and chats data
function useAssistantsData() {
	const [data, setData] = React.useState<{ assistants: Assistant[] }>({
		assistants: []
	});
	const [chats, setChats] = React.useState<Record<string, Chat[]>>({});
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		async function fetchAssistants() {
			try {
				const response = await fetch('/api/assistants');
				const result = await response.json();
				setData(result);

				// Fetch chats for each assistant
				const chatPromises = result.assistants.map(
					async (assistant: Assistant) => {
						const chatResponse = await fetch(
							`/api/assistants/${assistant.id}/chats`
						);
						const chatResult = await chatResponse.json();
						return {
							assistantId: assistant.id,
							chats: chatResult.chats || []
						};
					}
				);

				const chatResults = await Promise.all(chatPromises);
				const chatsMap = chatResults.reduce(
					(acc, { assistantId, chats }) => {
						acc[assistantId] = chats;
						return acc;
					},
					{} as Record<string, Chat[]>
				);

				setChats(chatsMap);
			} catch (error) {
				console.error('Failed to fetch data:', error);
			} finally {
				setLoading(false);
			}
		}

		fetchAssistants();
	}, []);

	return { assistants: data.assistants, chats, loading };
}

// Transform assistants and chats data to sidebar format
function transformDataToNavFormat(
	assistants: Assistant[],
	chats: Record<string, Chat[]>,
	currentPath: string
): NavItem[] {
	return assistants.map(assistant => ({
		title: assistant.name,
		url: `/assistants/${assistant.id}`,
		items: (chats[assistant.id] || []).map(chat => ({
			title: chat.title,
			url: `/assistants/${assistant.id}/chat/${chat.id}`,
			isActive:
				currentPath === `/assistants/${assistant.id}/chat/${chat.id}`
		}))
	}));
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const router = useRouter();
	const { assistants, chats, loading } = useAssistantsData();

	// Transform data to navigation format
	const navData = transformDataToNavFormat(assistants, chats, pathname);

	// Handle navigation
	const handleNavigation = (url: string) => {
		router.push(url);
	};

	if (loading) {
		return (
			<Sidebar {...props}>
				<SidebarHeader>
					<VersionSwitcher
						versions={['1.0.0']}
						defaultVersion='1.0.0'
					/>
					<SearchForm />
				</SidebarHeader>
				<SidebarContent className='gap-0'>
					<div className='p-4'>Loading...</div>
				</SidebarContent>
				<SidebarRail />
			</Sidebar>
		);
	}

	return (
		<Sidebar {...props}>
			<SidebarHeader>
				{/* <VersionSwitcher versions={['1.0.0']} defaultVersion='1.0.0' /> */}
				<SearchForm />
			</SidebarHeader>
			<SidebarContent className='gap-0'>
				{/* We create a collapsible SidebarGroup for each assistant. */}
				{navData.map(assistant => (
					<Collapsible
						key={assistant.title}
						title={assistant.title}
						defaultOpen
						className='group/collapsible'
					>
						<SidebarGroup>
							<SidebarGroupLabel
								asChild
								className='group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm'
							>
								<CollapsibleTrigger>
									{assistant.title}{' '}
									<ChevronRight className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90' />
								</CollapsibleTrigger>
							</SidebarGroupLabel>
							<CollapsibleContent>
								<SidebarGroupContent>
									<SidebarMenu>
										{assistant.items.map(chatItem => (
											<SidebarMenuItem
												key={chatItem.title}
											>
												<SidebarMenuButton
													asChild
													isActive={chatItem.isActive}
												>
													<Button
														onClick={() =>
															handleNavigation(
																chatItem.url
															)
														}
														className='w-full text-left truncate'
														title={chatItem.title}
													>
														<span className='truncate block max-w-[180px]'>
															{chatItem.title}
														</span>
													</Button>
												</SidebarMenuButton>
											</SidebarMenuItem>
										))}
										{assistant.items.length === 0 && (
											<SidebarMenuItem>
												<SidebarMenuButton disabled>
													No chats yet
												</SidebarMenuButton>
											</SidebarMenuItem>
										)}
									</SidebarMenu>
								</SidebarGroupContent>
							</CollapsibleContent>
						</SidebarGroup>
					</Collapsible>
				))}
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
