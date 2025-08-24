// components/chat/chat-skeleton.tsx
'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';

interface ChatSkeletonProps {
	showMessages?: boolean;
	messageCount?: number;
}

export function ChatSkeleton({
	showMessages = true,
	messageCount = 3
}: ChatSkeletonProps) {
	return (
		<div className='flex flex-col h-full max-h-full'>
			{/* Chat Header Skeleton */}
			<div className='flex items-center justify-between p-4 border-b bg-background shrink-0'>
				<div className='flex items-center gap-3'>
					<Avatar className='h-8 w-8'>
						<AvatarFallback>
							<Skeleton className='h-full w-full rounded-full' />
						</AvatarFallback>
					</Avatar>
					<div className='space-y-1'>
						<Skeleton className='h-5 w-24' />
						<Badge variant='secondary' className='text-xs'>
							<Skeleton className='h-3 w-12' />
						</Badge>
					</div>
				</div>
			</div>

			{/* Messages Area Skeleton */}
			<ScrollArea className='flex-1 min-h-0 p-4'>
				<div className='space-y-4'>
					{!showMessages ? (
						<div className='text-center text-muted-foreground py-8'>
							<Skeleton className='h-4 w-64 mx-auto' />
						</div>
					) : (
						Array.from({ length: messageCount }).map((_, index) => (
							<MessageBubbleSkeleton
								key={index}
								isUser={index % 2 === 0}
							/>
						))
					)}
				</div>
			</ScrollArea>

			{/* Input Area Skeleton */}
			<div className='p-4 border-t bg-background shrink-0'>
				<div className='flex space-x-2'>
					<div className='flex-1'>
						<Skeleton className='h-10 w-full' />
					</div>
					<Button disabled size='icon'>
						<Send className='h-4 w-4' />
					</Button>
				</div>
			</div>
		</div>
	);
}

// Message Bubble Skeleton Component
interface MessageBubbleSkeletonProps {
	isUser: boolean;
}

function MessageBubbleSkeleton({ isUser }: MessageBubbleSkeletonProps) {
	return (
		<div
			className={cn(
				'flex items-start space-x-2',
				isUser && 'flex-row-reverse space-x-reverse'
			)}
		>
			<Avatar className='h-8 w-8'>
				<AvatarFallback>
					<Skeleton className='h-full w-full rounded-full' />
				</AvatarFallback>
			</Avatar>

			<div
				className={cn(
					'flex flex-col',
					isUser ? 'items-end' : 'items-start'
				)}
			>
				<Card
					className={cn(
						'max-w-xs sm:max-w-md lg:max-w-lg',
						isUser ? 'bg-primary/10' : ''
					)}
				>
					<CardContent className='p-3'>
						<div className='space-y-2'>
							<Skeleton className='h-4 w-full' />
							<Skeleton className='h-4 w-3/4' />
							{Math.random() > 0.5 && (
								<Skeleton className='h-4 w-1/2' />
							)}
						</div>
					</CardContent>
				</Card>

				<div className='mt-1'>
					<Skeleton className='h-4 w-16' />
				</div>
			</div>
		</div>
	);
}

// Loading state for entire chat interface
export function ChatLoadingSkeleton() {
	return (
		<div className='flex flex-col h-full max-h-full animate-pulse'>
			{/* Header */}
			<div className='flex items-center justify-between p-4 border-b'>
				<div className='flex items-center gap-3'>
					<Skeleton className='h-8 w-8 rounded-full' />
					<div className='space-y-1'>
						<Skeleton className='h-5 w-24' />
						<Skeleton className='h-3 w-16' />
					</div>
				</div>
			</div>

			{/* Messages */}
			<div className='flex-1 p-4 space-y-4'>
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className={cn(
							'flex items-start space-x-2',
							i % 2 === 0 && 'flex-row-reverse space-x-reverse'
						)}
					>
						<Skeleton className='h-8 w-8 rounded-full' />
						<div
							className={cn(
								'flex flex-col space-y-1',
								i % 2 === 0 ? 'items-end' : 'items-start'
							)}
						>
							<Skeleton className='h-16 w-48 rounded-lg' />
							<Skeleton className='h-3 w-16' />
						</div>
					</div>
				))}
			</div>

			{/* Input */}
			<div className='p-4 border-t'>
				<div className='flex space-x-2'>
					<Skeleton className='h-10 flex-1' />
					<Skeleton className='h-10 w-10' />
				</div>
			</div>
		</div>
	);
}
