import { injectable, inject } from 'tsyringe';
import { JsonFileDatabase } from '../../database/json-file.database';
import { GuidelineDto, CreateGuidelineDto, UpdateGuidelineDto } from './guidelines.dto';
import { TagRepository } from '../tags/tags.repository';
import { randomBytes } from 'crypto';

@injectable()
export class GuidelineRepository {
  private db: JsonFileDatabase<GuidelineDto>;

  constructor(@inject(TagRepository) private tagRepository: TagRepository) {
    this.db = new JsonFileDatabase<GuidelineDto>('guidelines.json');
  }

  private generateId(): string {
    return `guid-${randomBytes(4).toString('hex')}`;
  }

  async create(createGuidelineDto: CreateGuidelineDto): Promise<GuidelineDto> {
    if (createGuidelineDto.tags) {
      for (const tagId of createGuidelineDto.tags) {
        const tag = await this.tagRepository.findById(tagId);
        if (!tag) {
          throw new Error(`Tag with id ${tagId} not found`);
        }
      }
    }

    const newGuideline: GuidelineDto = {
      id: this.generateId(),
      ...createGuidelineDto,
      enabled: createGuidelineDto.enabled ?? true,
      metadata: createGuidelineDto.metadata || {},
      tags: createGuidelineDto.tags || [],
    };
    return this.db.create(newGuideline);
  }

  async findAll(tagId?: string): Promise<GuidelineDto[]> {
    const allGuidelines = await this.db.findAll();
    if (tagId) {
      return allGuidelines.filter(g => g.tags.includes(tagId));
    }
    return allGuidelines;
  }

  async findById(id: string): Promise<GuidelineDto | null> {
    return this.db.findById(id);
  }

  async update(id: string, updateGuidelineDto: UpdateGuidelineDto): Promise<GuidelineDto> {
    const guideline = await this.findById(id);
    if (!guideline) {
        throw new Error('Item not found');
    }

    // This is a simplified update. A real implementation would handle nested updates for tags, metadata, etc.
    const { tags, metadata, tool_associations, ...restOfUpdate } = updateGuidelineDto;

    const updatedGuideline = { ...guideline, ...restOfUpdate };

    return this.db.update(id, updatedGuideline);
  }

  async delete(id: string): Promise<void> {
    return this.db.delete(id);
  }
}
