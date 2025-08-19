import { injectable, inject } from 'tsyringe';
import { JsonFileDatabase } from '../../database/json-file.database';
import { SessionDto, CreateSessionDto, UpdateSessionDto, SessionMode, EventDto, CreateEventDto } from './sessions.dto';
import { AgentRepository } from '../agents/agents.repository';
import { CustomerRepository } from '../customers/customers.repository';
import { randomBytes } from 'crypto';

@injectable()
export class SessionRepository {
  private db: JsonFileDatabase<SessionDto>;
  private eventDb: JsonFileDatabase<EventDto>;

  constructor(
    @inject(AgentRepository) private agentRepository: AgentRepository,
    @inject(CustomerRepository) private customerRepository: CustomerRepository
  ) {
    this.db = new JsonFileDatabase<SessionDto>('sessions.json');
    this.eventDb = new JsonFileDatabase<EventDto>('events.json');
  }

  private generateId(prefix: string): string {
    return `${prefix}-${randomBytes(4).toString('hex')}`;
  }

  async create(createSessionDto: CreateSessionDto): Promise<SessionDto> {
    const agent = await this.agentRepository.findById(createSessionDto.agent_id);
    if (!agent) {
      throw new Error(`Agent with id ${createSessionDto.agent_id} not found`);
    }

    const customerId = createSessionDto.customer_id || 'guest';
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error(`Customer with id ${customerId} not found`);
    }

    const newSession: SessionDto = {
      id: this.generateId('sess'),
      ...createSessionDto,
      customer_id: customerId,
      creation_utc: new Date().toISOString(),
      mode: SessionMode.AUTO,
      consumption_offsets: { client: 0 },
    };
    return this.db.create(newSession);
  }

  async findById(id: string): Promise<SessionDto | null> {
    return this.db.findById(id);
  }

  async findAll(agentId?: string, customerId?: string): Promise<SessionDto[]> {
    const allSessions = await this.db.findAll();
    return allSessions.filter(session => {
        let match = true;
        if(agentId) {
            match = match && session.agent_id === agentId;
        }
        if(customerId) {
            match = match && session.customer_id === customerId;
        }
        return match;
    });
  }

  async update(id: string, updateSessionDto: UpdateSessionDto): Promise<SessionDto> {
    return this.db.update(id, updateSessionDto);
  }

  async delete(id: string): Promise<void> {
    // Also delete all events associated with this session
    const events = await this.eventDb.findAll();
    const sessionEvents = events.filter(event => event.data.sessionId === id);
    for (const event of sessionEvents) {
      await this.eventDb.delete(event.id);
    }
    return this.db.delete(id);
  }

  async createEvent(sessionId: string, createEventDto: CreateEventDto): Promise<EventDto> {
    const session = await this.findById(sessionId);
    if (!session) {
      throw new Error(`Session with id ${sessionId} not found`);
    }

    const allEvents = await this.eventDb.findAll();
    const sessionEvents = allEvents.filter(event => event.data.sessionId === sessionId);


    const newEvent: EventDto = {
        id: this.generateId('evt'),
        ...createEventDto,
        offset: sessionEvents.length,
        creation_utc: new Date().toISOString(),
        correlation_id: this.generateId('corr'),
        data: {
            sessionId,
            ...createEventDto.data,
            message: createEventDto.message,
            participant: createEventDto.participant
        },
        deleted: false
    };

    return this.eventDb.create(newEvent);
  }

  async findEvents(sessionId: string): Promise<EventDto[]> {
    const allEvents = await this.eventDb.findAll();
    return allEvents.filter(event => event.data.sessionId === sessionId);
  }
}
