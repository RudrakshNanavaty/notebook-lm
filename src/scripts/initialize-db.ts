import { prisma } from '../lib/db';

async function initializeAssistants() {
  const assistants = [
    {
      type: 'legal',
      name: 'Legal Assistant',
      description: 'Indian Constitution, Penal Code, and Legal Documents',
      systemPrompt: `You are a legal assistant specializing in Indian law. Use the provided context from legal documents to answer questions accurately. Always cite relevant articles and sections when possible. Focus on:
- Indian Constitution
- Indian Penal Code
- Legal precedents and case law
- Regulatory compliance
Always provide legal information for educational purposes only.`
    }
  ];

  for (const assistant of assistants) {
    const created = await prisma.assistant.upsert({
      where: { type: assistant.type },
      update: assistant,
      create: assistant,
    });
    console.log(`✅ Assistant created: ${created.name} (${created.type})`);
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
