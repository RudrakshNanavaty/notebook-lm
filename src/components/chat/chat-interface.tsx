// components/chat/chat-interface.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Send, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

interface Message {
	id: string;
	content: string;
	role: 'user' | 'assistant';
	createdAt: Date;
	isStreaming?: boolean;
}

interface ChatInterfaceProps {
	assistantId: string;
	sessionId: string;
	assistantName?: string;
	initialMessages?: Message[];
	isLoading?: boolean;
}

export function ChatInterface({
	assistantId,
	sessionId,
	assistantName = 'Assistant',
	initialMessages = [],
	isLoading = false
}: ChatInterfaceProps) {
	const [messages, setMessages] = useState<Message[]>(initialMessages);
	const [inputValue, setInputValue] = useState('');
	const [isStreaming, setIsStreaming] = useState(false);
	const [abortController, setAbortController] =
		useState<AbortController | null>(null);
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (scrollAreaRef.current) {
			const scrollElement = scrollAreaRef.current.querySelector(
				'[data-radix-scroll-area-viewport]'
			);
			if (scrollElement) {
				scrollElement.scrollTop = scrollElement.scrollHeight;
			}
		}
	}, [messages]);

	// Show loading state
	if (isLoading) {
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
							<Skeleton className='h-3 w-16' />
						</div>
					</div>
				</div>

				{/* Messages Area Skeleton */}
				<ScrollArea className='flex-1 min-h-0 p-4'>
					<div className='space-y-4'>
						{Array.from({ length: 3 }).map((_, index) => (
							<div
								key={index}
								className={cn(
									'flex items-start space-x-2',
									index % 2 === 0 &&
										'flex-row-reverse space-x-reverse'
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
										index % 2 === 0
											? 'items-end'
											: 'items-start'
									)}
								>
									<Card className='max-w-xs sm:max-w-md lg:max-w-lg'>
										<CardContent className='p-3'>
											<div className='space-y-2'>
												<Skeleton className='h-4 w-full' />
												<Skeleton className='h-4 w-3/4' />
											</div>
										</CardContent>
									</Card>
									<Skeleton className='h-3 w-16 mt-1' />
								</div>
							</div>
						))}
					</div>
				</ScrollArea>

				{/* Input Area Skeleton */}
				<div className='p-4 border-t bg-background shrink-0'>
					<div className='flex space-x-2'>
						<Skeleton className='h-10 flex-1' />
						<Button disabled size='icon'>
							<Send className='h-4 w-4' />
						</Button>
					</div>
				</div>
			</div>
		);
	}

	const stopStreaming = () => {
		if (abortController) {
			abortController.abort();
			setAbortController(null);
		}
		setIsStreaming(false);
	};

	const handleSendMessage = async () => {
		if (!inputValue.trim() || isStreaming) return;

		const userMessage: Message = {
			id: `user_${Date.now()}`,
			content: inputValue,
			role: 'user',
			createdAt: new Date()
		};

		setMessages(prev => [...prev, userMessage]);
		const messageToSend = inputValue;
		setInputValue('');
		setIsStreaming(true);

		// Create streaming assistant message
		const streamingMessageId = `assistant_${Date.now()}`;
		const streamingMessage: Message = {
			id: streamingMessageId,
			content: '',
			role: 'assistant',
			createdAt: new Date(),
			isStreaming: true
		};

		setMessages(prev => [...prev, streamingMessage]);

		const controller = new AbortController();
		setAbortController(controller);

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: messageToSend,
					assistantId: assistantId,
					sessionId: sessionId
				}),
				signal: controller.signal
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			if (!response.body) {
				throw new Error('No response body');
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = ''; // Buffer for incomplete chunks

			while (true) {
				const { done, value } = await reader.read();

				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				buffer += chunk; // Add to buffer

				const lines = buffer.split('\n');
				buffer = lines.pop() || ''; // Keep incomplete line in buffer

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						try {
							const jsonData = line.slice(6).trim();
							if (jsonData) {
								// Only parse if there's data
								const data = JSON.parse(jsonData);

								if (data.error) {
									throw new Error(data.error);
								}

								if (data.done) {
									// Mark streaming as complete
									setMessages(prev =>
										prev.map(msg =>
											msg.id === streamingMessageId
												? { ...msg, isStreaming: false }
												: msg
										)
									);
									setIsStreaming(false);
									setAbortController(null);
									return; // Exit the entire function
								}

								if (data.content) {
									// Append content to streaming message
									setMessages(prev =>
										prev.map(msg =>
											msg.id === streamingMessageId
												? {
														...msg,
														content:
															msg.content +
															data.content
												  }
												: msg
										)
									);
								}
							}
						} catch (parseError) {
							console.error(
								'Failed to parse streaming data:',
								parseError,
								'Line:',
								line
							);
							// Continue processing other lines instead of breaking
						}
					}
				}
			}
		} catch (error: any) {
			console.error('Streaming failed:', error);

			if (error.name !== 'AbortError') {
				// Replace streaming message with error message
				setMessages(prev =>
					prev.map(msg =>
						msg.id === streamingMessageId
							? {
									...msg,
									content: `Error: ${error.message}. Please try again.`,
									isStreaming: false
							  }
							: msg
					)
				);
			} else {
				// Remove the streaming message if aborted
				setMessages(prev =>
					prev.filter(msg => msg.id !== streamingMessageId)
				);
			}
		} finally {
			setIsStreaming(false);
			setAbortController(null);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	return (
		<div className='flex flex-col h-full max-h-full'>
			{/* Chat Header */}
			<div className='flex items-center justify-between pb-4 border-b bg-background shrink-0'>
				<div className='flex items-center gap-3'>
					<Avatar className='h-8 w-8'>
						<AvatarImage src='/assistant-avatar.png' />
						<AvatarFallback>AI</AvatarFallback>
					</Avatar>
					<div>
						<h2 className='font-semibold'>{assistantName}</h2>
						<Badge variant='secondary' className='text-xs'>
							{isStreaming ? 'Typing...' : 'Online'}
						</Badge>
					</div>
				</div>
				{isStreaming && (
					<Button variant='outline' size='sm' onClick={stopStreaming}>
						<Square className='h-4 w-4 mr-2' />
						Stop
					</Button>
				)}
			</div>

			{/* Messages Area */}
			<ScrollArea className='flex-1 min-h-0 p-4' ref={scrollAreaRef}>
				<div className='space-y-4'>
					{messages.length === 0 && (
						<div className='text-center text-muted-foreground py-8'>
							<p>Start a conversation with your assistant!</p>
						</div>
					)}

					{messages.map(message => (
						<MessageBubble key={message.id} message={message} />
					))}
				</div>
			</ScrollArea>

			{/* Input Area */}
			<div className='p-4 border-t bg-background shrink-0'>
				<div className='flex space-x-2'>
					<Input
						value={inputValue}
						onChange={e => setInputValue(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder='Type your message...'
						disabled={isStreaming}
						className='flex-1'
					/>
					<Button
						onClick={handleSendMessage}
						disabled={!inputValue.trim() || isStreaming}
						size='icon'
					>
						<Send className='h-4 w-4' />
					</Button>
				</div>
			</div>
		</div>
	);
}

// Updated Message Bubble Component
interface MessageBubbleProps {
	message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
	const isUser = message.role === 'user';

	return (
		<div
			className={cn(
				'flex items-start space-x-2',
				isUser && 'flex-row-reverse space-x-reverse'
			)}
		>
			<Avatar className='h-8 w-8'>
				<AvatarImage
					src={isUser ? '/user-avatar.png' : '/assistant-avatar.png'}
				/>
				<AvatarFallback>{isUser ? 'U' : 'AI'}</AvatarFallback>
			</Avatar>

			<div
				className={cn(
					'flex flex-col max-w-full sm:max-w-4/5',
					isUser ? 'items-end' : 'items-start'
				)}
			>
				<Card
					className={cn(
						'max-w-full p-0',
						isUser ? 'bg-primary text-primary-foreground' : ''
					)}
				>
					<CardContent
						className={cn('text-sm', isUser ? 'px-4' : 'py-2')}
					>
						<div className='prose prose-sm dark:prose-invert max-w-none'>
							<ReactMarkdown
								remarkPlugins={[remarkGfm]}
								rehypePlugins={[rehypeHighlight]}
							>
								{message.content}
							</ReactMarkdown>
							{message.isStreaming && (
								<span className='inline-block w-2 h-4 ml-1 bg-current animate-pulse' />
							)}
						</div>
					</CardContent>
				</Card>

				<Badge variant='outline' className='mt-1 text-xs'>
					{message.createdAt.toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit'
					})}
					{message.isStreaming && ' • Streaming...'}
				</Badge>
			</div>
		</div>
	);
}
