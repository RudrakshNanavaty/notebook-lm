import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Initialize default assistants
export async function initializeAssistants() {
  const assistants = [
    {
      type: 'legal',
      name: 'Legal Assistant',
      description: 'Indian Constitution, Penal Code, and Legal Documents',
      systemPrompt: `You are a legal assistant specializing in Indian law. Use the provided context from legal documents to answer questions accurately. Always cite relevant sections when possible. Focus on:
- Indian Constitution
- Indian Penal Code
- Legal precedents and case law
- Regulatory compliance
Always provide legal information for educational purposes only and remind users to consult qualified legal professionals for specific legal advice.`
    },
    {
      type: 'tax',
      name: 'Tax Assistant',
      description: 'Tax Codes, Policy Documents, and Compliance Guides',
      systemPrompt: `You are a tax assistant with expertise in Indian taxation. Use the provided context from tax codes and policies to provide accurate tax guidance. Focus on:
- Income Tax Act
- GST regulations
- Tax planning strategies
- Compliance requirements
Always remind users that tax advice should be verified with qualified tax professionals for specific situations.`
    },
    {
      type: 'general',
      name: 'General Assistant',
      description: 'General Knowledge Base',
      systemPrompt: `You are a helpful general assistant. Use the provided context to answer questions accurately and helpfully across various topics.`
    }
  ];

  for (const assistant of assistants) {
    await prisma.assistant.upsert({
      where: { type: assistant.type },
      update: assistant,
      create: assistant,
    });
  }
}
