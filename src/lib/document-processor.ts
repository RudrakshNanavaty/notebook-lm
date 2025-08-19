import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { prisma } from './db';

export class DocumentProcessor {
  private pinecone: Pinecone;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
    });
  }

  async processDocument(
    text: string,
    assistantType: string,
    fileName: string
  ): Promise<{ documentId: string; chunksCreated: number }> {

    // Create document record
    const assistant = await prisma.assistant.findUnique({
      where: { type: assistantType }
    });

    if (!assistant) {
      throw new Error(`Assistant type ${assistantType} not found`);
    }

    const document = await prisma.document.create({
      data: {
        fileName,
        originalText: text,
        chunks: 0,
        status: 'processing',
        assistantId: assistant.id,
      }
    });

    try {
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const docs = await textSplitter.createDocuments([text], [{
        assistantType,
        fileName,
        documentId: document.id,
        timestamp: new Date().toISOString(),
      }]);

      const index = this.pinecone.Index(process.env.PINECONE_INDEX_NAME!);

      await PineconeStore.fromDocuments(docs, this.embeddings, {
        pineconeIndex: index,
        namespace: assistantType,
      });

      // Update document status
      await prisma.document.update({
        where: { id: document.id },
        data: {
          chunks: docs.length,
          status: 'completed',
        }
      });

      return { documentId: document.id, chunksCreated: docs.length };
    } catch (error) {
      // Update document status to failed
      await prisma.document.update({
        where: { id: document.id },
        data: { status: 'failed' }
      });
      throw error;
    }
  }

  async queryDocuments(query: string, assistantType: string, topK: number = 5) {
    const index = this.pinecone.Index(process.env.PINECONE_INDEX_NAME!);

    const vectorStore = await PineconeStore.fromExistingIndex(
      this.embeddings,
      {
        pineconeIndex: index,
        namespace: assistantType,
      }
    );

    const results = await vectorStore.similaritySearch(query, topK);
    return results;
  }

  async getDocumentsByAssistant(assistantType: string) {
    const assistant = await prisma.assistant.findUnique({
      where: { type: assistantType },
      include: {
        documents: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    return assistant?.documents || [];
  }
}
