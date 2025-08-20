import { BaseDocumentLoader } from '@langchain/core/document_loaders/base';
import { Document } from '@langchain/core/documents';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { prisma } from './db';

// Custom embedding class for Pinecone's llama model with rate limiting
class PineconeLlamaEmbeddings {
  private pinecone: Pinecone;
  private model = 'llama-text-embed-v2';
  private batchSize = 32; // Reduced batch size to control token usage
  private delayBetweenBatches = 1000; // 1 second delay between batches

  constructor(pinecone: Pinecone) {
    this.pinecone = pinecone;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        if (error.status === 429 && attempt < maxRetries) {
          // Rate limit hit, wait with exponential backoff
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries + 1})`);
          await this.sleep(delay);
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const parameters = {
      input_type: 'passage',
      truncate: 'END'
    };

    // Split texts into smaller chunks to manage token usage
    const textChunks = this.chunkArray(texts, this.batchSize);
    const allEmbeddings: number[][] = [];

    console.log(`Processing ${textChunks.length} batches of embeddings...`);

    // Process each chunk with rate limiting
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];

      try {
        const embeddings = await this.retryWithBackoff(async () => {
          return await this.pinecone.inference.embed(
            this.model,
            chunk,
            parameters
          );
        });

        const chunkEmbeddings = embeddings.data.map(embedding => {
          if (embedding.vectorType === 'dense') {
            return embedding.values;
          }
          throw new Error('Expected dense embedding but received different type');
        });

        allEmbeddings.push(...chunkEmbeddings);

        console.log(`Processed batch ${i + 1}/${textChunks.length}`);

        // Add delay between batches to avoid rate limiting
        if (i < textChunks.length - 1) {
          await this.sleep(this.delayBetweenBatches);
        }

      } catch (error: any) {
        console.error(`Error processing batch ${i + 1}:`, error.message);
        throw error;
      }
    }

    return allEmbeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    const parameters = {
      input_type: 'query',
      truncate: 'END'
    };

    const embeddings = await this.retryWithBackoff(async () => {
      return await this.pinecone.inference.embed(
        this.model,
        [text],
        parameters
      );
    });

    const embedding = embeddings.data[0];
    if (embedding.vectorType === 'dense') {
      return embedding.values;
    }
    throw new Error('Expected dense embedding but received different type');
  }
}

export class DocumentProcessor {
  private pinecone: Pinecone;
  private embeddings: PineconeLlamaEmbeddings;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    this.embeddings = new PineconeLlamaEmbeddings(this.pinecone);
  }

  async processDocument(
    text: string,
    assistantId: string,
    fileName: string,
    sourceType: 'pdf' | 'website' = 'pdf',
    sourceUrl?: string,
    mimeType?: string,
    fileSize?: number
  ): Promise<{ documentId: string; chunksCreated: number }> {

    // Create document record
    const assistant = await prisma.assistant.findUnique({
      where: { id: assistantId }
    });

    if (!assistant) {
      throw new Error(`Assistant with id ${assistantId} not found`);
    }

    const document = await prisma.document.create({
      data: {
        fileName,
        sourceType,
        sourceUrl,
        mimeType,
        fileSize,
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
        assistantId,
        fileName,
        documentId: document.id,
        sourceType,
        sourceUrl,
        timestamp: new Date().toISOString(),
      }]);

      console.log(`Processing ${docs.length} document chunks for embedding...`);

      const index = this.pinecone.Index(process.env.PINECONE_INDEX_NAME!);

      await PineconeStore.fromDocuments(docs, this.embeddings, {
        pineconeIndex: index,
        namespace: assistantId,
      });

      // Update document status
      await prisma.document.update({
        where: { id: document.id },
        data: {
          chunks: docs.length,
          status: 'completed',
        }
      });

      console.log(`Successfully processed document: ${fileName}`);
      return { documentId: document.id, chunksCreated: docs.length };
    } catch (error) {
      console.error(`Failed to process document: ${fileName}`, error);
      // Update document status to failed
      await prisma.document.update({
        where: { id: document.id },
        data: { status: 'failed' }
      });
      throw error;
    }
  }

  async processDocumentFromLoader(
    loader: BaseDocumentLoader,
    assistantId: string,
    fileName: string,
    sourceType: 'pdf' | 'website' = 'pdf',
    sourceUrl?: string,
    mimeType?: string,
    fileSize?: number
  ): Promise<{ documentId: string; chunksCreated: number }> {

    // Create document record
    const assistant = await prisma.assistant.findUnique({
      where: { id: assistantId }
    });

    if (!assistant) {
      throw new Error(`Assistant with id ${assistantId} not found`);
    }

    // Load documents using the provided loader
    const loadedDocs = await loader.load();

    if (loadedDocs.length === 0) {
      throw new Error('No documents were loaded from the source');
    }

    // Combine all loaded document content
    const combinedText = loadedDocs.map(doc => doc.pageContent).join('\n\n');

    const document = await prisma.document.create({
      data: {
        fileName,
        sourceType,
        sourceUrl,
        mimeType,
        fileSize: fileSize || combinedText.length,
        originalText: combinedText,
        chunks: 0,
        status: 'processing',
        assistantId: assistant.id,
      }
    });

    try {
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 512,
        chunkOverlap: 100,
      });

      // Split the loaded documents
      const splitDocs = await textSplitter.splitDocuments(loadedDocs);

      // Add metadata to each chunk
      const docsWithMetadata = splitDocs.map(doc => new Document({
        pageContent: doc.pageContent,
        metadata: {
          ...doc.metadata,
          assistantId,
          fileName,
          documentId: document.id,
          sourceType,
          sourceUrl,
          timestamp: new Date().toISOString(),
        }
      }));

      console.log(`Processing ${docsWithMetadata.length} document chunks for embedding...`);

      const index = this.pinecone.Index(process.env.PINECONE_INDEX_NAME!);

      await PineconeStore.fromDocuments(docsWithMetadata, this.embeddings, {
        pineconeIndex: index,
        namespace: assistantId,
      });

      // Update document status
      await prisma.document.update({
        where: { id: document.id },
        data: {
          chunks: docsWithMetadata.length,
          status: 'completed',
        }
      });

      console.log(`Successfully processed document: ${fileName}`);
      return { documentId: document.id, chunksCreated: docsWithMetadata.length };
    } catch (error) {
      console.error(`Failed to process document: ${fileName}`, error);
      // Update document status to failed
      await prisma.document.update({
        where: { id: document.id },
        data: { status: 'failed' }
      });
      throw error;
    }
  }

  async queryDocuments(query: string, assistantId: string, topK: number = 5) {
    const index = this.pinecone.Index(process.env.PINECONE_INDEX_NAME!);

    const vectorStore = await PineconeStore.fromExistingIndex(
      this.embeddings,
      {
        pineconeIndex: index,
        namespace: assistantId,
      }
    );

    return vectorStore.similaritySearch(query, topK);
  }

  async getDocumentsByAssistant(assistantId: string) {
    const assistant = await prisma.assistant.findUnique({
      where: { id: assistantId },
      include: {
        documents: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    return assistant?.documents || [];
  }
}

// Export an instance for singleton usage
export const documentProcessor = new DocumentProcessor();
