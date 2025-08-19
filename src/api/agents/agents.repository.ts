import { injectable, inject } from 'tsyringe';
import { JsonFileDatabase } from '../../database/json-file.database';
import { AgentDto, CreateAgentDto, UpdateAgentDto, CompositionMode } from './agents.dto';
import { TagRepository } from '../tags/tags.repository';
import { randomBytes } from 'crypto';

@injectable()
export class AgentRepository {
  private db: JsonFileDatabase<AgentDto>;

  constructor(@inject(TagRepository) private tagRepository: TagRepository) {
    this.db = new JsonFileDatabase<AgentDto>('agents.json');
  }

  private generateId(): string {
    return `agent-${randomBytes(4).toString('hex')}`;
  }

  async create(createAgentDto: CreateAgentDto): Promise<AgentDto> {
    if (createAgentDto.tags) {
      for (const tagId of createAgentDto.tags) {
        const tag = await this.tagRepository.findById(tagId);
        if (!tag) {
          throw new Error(`Tag with id ${tagId} not found`);
        }
      }
    }

    const newAgent: AgentDto = {
      id: this.generateId(),
      ...createAgentDto,
      creation_utc: new Date().toISOString(),
      max_engine_iterations: createAgentDto.max_engine_iterations || 1,
      composition_mode: createAgentDto.composition_mode || CompositionMode.FLUID,
      tags: createAgentDto.tags ? [...new Set(createAgentDto.tags)] : [],
    };
    return this.db.create(newAgent);
  }

  async findAll(): Promise<AgentDto[]> {
    return this.db.findAll();
  }

  async findById(id: string): Promise<AgentDto | null> {
    return this.db.findById(id);
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<AgentDto> {
    const agent = await this.findById(id);
    if (!agent) {
      throw new Error('Item not found');
    }

    const { tags, ...restOfUpdate } = updateAgentDto;
    let updatedTags = agent.tags;

    if (tags) {
      if (tags.add) {
        for (const tagId of tags.add) {
          const tag = await this.tagRepository.findById(tagId);
          if (!tag) {
            throw new Error(`Tag with id ${tagId} not found`);
          }
          if (!updatedTags.includes(tagId)) {
            updatedTags.push(tagId);
          }
        }
      }
      if (tags.remove) {
        updatedTags = updatedTags.filter(tagId => !tags.remove?.includes(tagId));
      }
    }

    const updatedAgent = { ...agent, ...restOfUpdate, tags: updatedTags };
    return this.db.update(id, updatedAgent);
  }

  async delete(id: string): Promise<void> {
    return this.db.delete(id);
  }
}
