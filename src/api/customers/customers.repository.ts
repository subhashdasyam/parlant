import { injectable, inject } from 'tsyringe';
import { JsonFileDatabase } from '../../database/json-file.database';
import { CustomerDto, CreateCustomerDto, UpdateCustomerDto } from './customers.dto';
import { TagRepository } from '../tags/tags.repository';
import { randomBytes } from 'crypto';

@injectable()
export class CustomerRepository {
  private db: JsonFileDatabase<CustomerDto>;

  constructor(@inject(TagRepository) private tagRepository: TagRepository) {
    this.db = new JsonFileDatabase<CustomerDto>('customers.json');
  }

  private generateId(): string {
    return `cust-${randomBytes(4).toString('hex')}`;
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<CustomerDto> {
    if (createCustomerDto.tags) {
      for (const tagId of createCustomerDto.tags) {
        const tag = await this.tagRepository.findById(tagId);
        if (!tag) {
          throw new Error(`Tag with id ${tagId} not found`);
        }
      }
    }

    const newCustomer: CustomerDto = {
      id: this.generateId(),
      ...createCustomerDto,
      creation_utc: new Date().toISOString(),
      metadata: createCustomerDto.metadata || {},
      tags: createCustomerDto.tags || [],
    };
    return this.db.create(newCustomer);
  }

  async findAll(): Promise<CustomerDto[]> {
    return this.db.findAll();
  }

  async findById(id: string): Promise<CustomerDto | null> {
    if (id === 'guest') {
        return {
            id: 'guest',
            creation_utc: new Date().toISOString(),
            name: 'Guest',
            metadata: {},
            tags: [],
        }
    }
    return this.db.findById(id);
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerDto> {
    const customer = await this.findById(id);
    if (!customer) {
        throw new Error('Item not found');
    }

    const { tags, metadata, ...restOfUpdate } = updateCustomerDto;

    const updatedCustomer = { ...customer, ...restOfUpdate };

    if (metadata) {
        if (metadata.set) {
            updatedCustomer.metadata = { ...updatedCustomer.metadata, ...metadata.set };
        }
        if (metadata.unset) {
            for (const key of metadata.unset) {
                delete updatedCustomer.metadata[key];
            }
        }
    }

    if (tags) {
        if (tags.add) {
            for (const tagId of tags.add) {
                const tag = await this.tagRepository.findById(tagId);
                if (!tag) {
                    throw new Error(`Tag with id ${tagId} not found`);
                }
                if (!updatedCustomer.tags.includes(tagId)) {
                    updatedCustomer.tags.push(tagId);
                }
            }
        }
        if (tags.remove) {
            updatedCustomer.tags = updatedCustomer.tags.filter(tagId => !tags.remove?.includes(tagId));
        }
    }

    return this.db.update(id, updatedCustomer);
  }

  async delete(id: string): Promise<void> {
    return this.db.delete(id);
  }
}
