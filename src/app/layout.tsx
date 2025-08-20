import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
	title: 'Notebook LM',
	description: 'Notebook LM allows you to create your own AI assistants.'
};

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body
				className={cn(
					'flex min-h-svh flex-col antialiased',
					inter.className
				)}
			>
				<ThemeProvider
					attribute='class'
					defaultTheme='system'
					enableSystem
					disableTransitionOnChange
				>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
