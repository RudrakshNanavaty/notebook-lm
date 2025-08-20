import { prisma } from '../lib/db';

async function initializeAssistants() {
  const assistants = [
    {
      name: 'Karvey Specter',
      description: 'Indian Constitution, Penal Code, and Legal Documents',
      systemPrompt: `You are a legal assistant specializing in Indian law. Use the provided context from legal documents to answer questions accurately. Always cite relevant articles and sections when possible. Focus on:
- Indian Constitution
- Indian Penal Code
- Legal precedents and case law
- Regulatory compliance
Always provide legal information for educational purposes only.`
    },
    {
      id: 'tax-assistant-001',
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
      id: 'general-assistant-001',
      name: 'General Assistant',
      description: 'General Knowledge Base',
      systemPrompt: `You are a helpful general assistant. Use the provided context to answer questions accurately and helpfully across various topics.`
    }
  ];

  for (const assistant of assistants) {
    const created = await prisma.assistant.upsert({
      where: { id: assistant.id },
      update: {
        name: assistant.name,
        description: assistant.description,
        systemPrompt: assistant.systemPrompt
      },
      create: assistant,
    });
    console.log(`✅ Assistant created: ${created.name} (${created.id})`);
  }
}

async function main() {
  console.log('🚀 Initializing database...');
  await initializeAssistants();
  console.log('✅ Database initialized successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
