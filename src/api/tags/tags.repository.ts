import { injectable } from 'tsyringe';
import { JsonFileDatabase } from '../../database/json-file.database';
import { TagDto, CreateTagDto, UpdateTagDto } from './tags.dto';
import { randomBytes } from 'crypto';

@injectable()
export class TagRepository {
  private db: JsonFileDatabase<TagDto>;

  constructor() {
    this.db = new JsonFileDatabase<TagDto>('tags.json');
  }

  private generateId(): string {
    return `tag-${randomBytes(4).toString('hex')}`;
  }

  async create(createTagDto: CreateTagDto): Promise<TagDto> {
    const newTag: TagDto = {
      id: this.generateId(),
      ...createTagDto,
      creation_utc: new Date().toISOString(),
    };
    return this.db.create(newTag);
  }

  async findAll(): Promise<TagDto[]> {
    return this.db.findAll();
  }

  async findById(id: string): Promise<TagDto | null> {
    return this.db.findById(id);
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<TagDto> {
    return this.db.update(id, updateTagDto);
  }

  async delete(id: string): Promise<void> {
    return this.db.delete(id);
  }
}
