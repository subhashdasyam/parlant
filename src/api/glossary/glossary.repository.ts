import { injectable, inject } from 'tsyringe';
import { JsonFileDatabase } from '../../database/json-file.database';
import { TermDto, CreateTermDto, UpdateTermDto } from './glossary.dto';
import { TagRepository } from '../tags/tags.repository';
import { randomBytes } from 'crypto';

@injectable()
export class GlossaryRepository {
  private db: JsonFileDatabase<TermDto>;

  constructor(@inject(TagRepository) private tagRepository: TagRepository) {
    this.db = new JsonFileDatabase<TermDto>('glossary.json');
  }

  private generateId(): string {
    return `term-${randomBytes(4).toString('hex')}`;
  }

  async create(createTermDto: CreateTermDto): Promise<TermDto> {
    if (createTermDto.tags) {
      for (const tagId of createTermDto.tags) {
        const tag = await this.tagRepository.findById(tagId);
        if (!tag) {
          throw new Error(`Tag with id ${tagId} not found`);
        }
      }
    }

    const newTerm: TermDto = {
      id: this.generateId(),
      ...createTermDto,
      tags: createTermDto.tags || [],
    };
    return this.db.create(newTerm);
  }

  async findAll(tagId?: string): Promise<TermDto[]> {
    const allTerms = await this.db.findAll();
    if (tagId) {
      return allTerms.filter(term => term.tags.includes(tagId));
    }
    return allTerms;
  }

  async findById(id: string): Promise<TermDto | null> {
    return this.db.findById(id);
  }

  async update(id: string, updateTermDto: UpdateTermDto): Promise<TermDto> {
    const term = await this.findById(id);
    if (!term) {
        throw new Error('Item not found');
    }

    // This is a simplified update. A real implementation would handle nested updates for tags.
    const { tags, ...restOfUpdate } = updateTermDto;

    const updatedTerm = { ...term, ...restOfUpdate };

    return this.db.update(id, updatedTerm);
  }

  async delete(id: string): Promise<void> {
    return this.db.delete(id);
  }
}
