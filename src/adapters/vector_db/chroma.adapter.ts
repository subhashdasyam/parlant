import { injectable, inject } from 'tsyringe';
import { ChromaClient } from 'chromadb';
import { Logger } from '../../core/types';

// Placeholder for the ChromaDB adapter
@injectable()
export class ChromaDbAdapter {
  private client: ChromaClient;

  constructor(@inject('Logger') private logger: Logger) {
    this.client = new ChromaClient();
    this.logger.info('ChromaDbAdapter initialized');
  }

  async getOrCreateCollection(name: string) {
    this.logger.info(`Getting or creating collection: ${name}`);
    try {
        const collection = await this.client.getOrCreateCollection({ name });
        return collection;
    } catch (error) {
        this.logger.error(`Error getting or creating collection: ${error}`);
        throw error;
    }
  }
}
