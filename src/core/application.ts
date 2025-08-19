import { injectable, inject } from 'tsyringe';
import {
  Logger,
  ContextualCorrelator,
  SessionStore,
  SessionListener,
  GuidelineStore,
  GuidelineToolAssociationStore,
  RelationshipStore,
  JourneyStore,
  Engine,
  EventEmitterFactory,
  BackgroundTaskService,
} from './types';

@injectable()
export class Application {
  constructor(
    @inject('Logger') private logger: Logger,
    @inject('ContextualCorrelator') private correlator: ContextualCorrelator,
    @inject('SessionStore') private sessionStore: SessionStore,
    @inject('SessionListener') private sessionListener: SessionListener,
    @inject('GuidelineStore') private guidelineStore: GuidelineStore,
    @inject('GuidelineToolAssociationStore')
    private guidelineToolAssociationStore: GuidelineToolAssociationStore,
    @inject('RelationshipStore') private relationshipStore: RelationshipStore,
    @inject('JourneyStore') private journeyStore: JourneyStore,
    @inject('Engine') private engine: Engine,
    @inject('EventEmitterFactory')
    private eventEmitterFactory: EventEmitterFactory,
    @inject('BackgroundTaskService')
    private backgroundTaskService: BackgroundTaskService
  ) {}

  async createCustomerSession(
    customerId: string,
    agentId: string,
    title?: string,
    allowGreeting = false
  ): Promise<any> {
    const session = await this.sessionStore.create_session({
      creation_utc: new Date().toISOString(),
      customer_id: customerId,
      agent_id: agentId,
      title: title,
    });

    if (allowGreeting) {
      // In the python version, this dispatches a background task.
      // For now, we'll just log it.
      this.logger.info(`Dispatching processing task for session ${session.id}`);
    }

    return session;
  }
}
