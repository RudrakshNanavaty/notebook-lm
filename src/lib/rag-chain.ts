import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { prisma } from './db';
import { documentProcessor, DocumentProcessor } from './document-processor';

export class RAGChain {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-5-nano', // https://platform.openai.com/docs/pricing
      openAIApiKey: process.env.OPENAI_API_KEY!,
    });
  }

  async queryRAG(
    question: string,
    assistantId: string,
    sessionId?: string
  ): Promise<{ response: string; retrievedDocs: any[] }> {
    try {
      // Get assistant info
      const assistant = await prisma.assistant.findUnique({
        where: { id: assistantId }
      });

      if (!assistant) {
        throw new Error(`Assistant with id ${assistantId} not found`);
      }

      // Retrieve relevant documents
      const relevantDocs = await documentProcessor.queryDocuments(
        question,
        assistantId
      );

      if (relevantDocs.length === 0) {
        return {
          response: `I don't have specific information about that in my knowledge base. Please upload relevant documents first.`,
          retrievedDocs: []
        };
      }

      // Create context from retrieved documents
      const context = relevantDocs
        .map((doc, index) => `[Source ${index + 1}] ${doc.pageContent}`)
        .join('\n\n');

      // Create prompt template
      const promptTemplate = PromptTemplate.fromTemplate(`
        ${assistant.systemPrompt}

        Context from knowledge base:
        ${context}

        Question: ${question}

        Answer based on the provided context. If the context doesn't contain relevant information, say so clearly.
      `);

      // Create and run the chain
      const chain = RunnableSequence.from([
        promptTemplate,
        this.llm,
      ]);

      const response = await chain.invoke({
        context,
        question,
      });

      // Save message if session provided
      if (sessionId) {
        await this.saveMessage(sessionId, question, response.content as string, relevantDocs);
      }

      return {
        response: response.content as string,
        retrievedDocs: relevantDocs.map(doc => ({
          content: doc.pageContent,
          metadata: doc.metadata
        }))
      };
    } catch (error) {
      console.error('RAG query error:', error);
      return {
        response: 'Sorry, I encountered an error processing your question. Please try again.',
        retrievedDocs: []
      };
    }
  }

  async saveMessage(sessionId: string, userMessage: string, assistantResponse: string, retrievedDocs: any[]) {
    await prisma.message.createMany({
      data: [
        {
          content: userMessage,
          role: 'user',
          sessionId,
        },
        {
          content: assistantResponse,
          role: 'assistant',
          sessionId,
          retrievedDocs: retrievedDocs.map(doc => ({
            content: doc.pageContent,
            metadata: doc.metadata
          }))
        }
      ]
    });
  }

  async createChatSession(assistantId: string): Promise<string> {
    const assistant = await prisma.assistant.findUnique({
      where: { id: assistantId }
    });

    if (!assistant) {
      throw new Error(`Assistant with id ${assistantId} not found`);
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.chatSession.create({
      data: {
        sessionId,
        assistantId: assistant.id,
      }
    });

    return sessionId;
  }
}
