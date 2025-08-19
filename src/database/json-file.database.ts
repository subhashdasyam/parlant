import { promises as fs } from 'fs';
import path from 'path';

export class JsonFileDatabase<T extends { id: string }> {
  private data: Map<string, T> = new Map();
  private dataLoaded = false;

  constructor(private readonly filePath: string) {
    this.filePath = path.join('parlant-data', filePath);
  }

  private async ensureDataLoaded(): Promise<void> {
    if (!this.dataLoaded) {
      await this.load();
      this.dataLoaded = true;
    }
  }

  private async load(): Promise<void> {
    try {
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      const items: T[] = JSON.parse(fileContent);
      this.data = new Map(items.map((item) => [item.id, item]));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, start with an empty map
        this.data = new Map();
      } else {
        throw error;
      }
    }
  }

  private async save(): Promise<void> {
    const items = Array.from(this.data.values());
    await fs.writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
  }

  async create(item: T): Promise<T> {
    await this.ensureDataLoaded();
    if (this.data.has(item.id)) {
      throw new Error('Item with this ID already exists');
    }
    this.data.set(item.id, item);
    await this.save();
    return item;
  }

  async findById(id: string): Promise<T | null> {
    await this.ensureDataLoaded();
    return this.data.get(id) || null;
  }

  async findAll(): Promise<T[]> {
    await this.ensureDataLoaded();
    return Array.from(this.data.values());
  }

  async update(id: string, partialItem: Partial<T>): Promise<T> {
    await this.ensureDataLoaded();
    const existingItem = this.data.get(id);
    if (!existingItem) {
      throw new Error('Item not found');
    }
    const updatedItem = { ...existingItem, ...partialItem };
    this.data.set(id, updatedItem);
    await this.save();
    return updatedItem;
  }

  async delete(id: string): Promise<void> {
    await this.ensureDataLoaded();
    if (!this.data.has(id)) {
      throw new Error('Item not found');
    }
    this.data.delete(id);
    await this.save();
  }
}
