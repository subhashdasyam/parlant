import { injectable, inject } from 'tsyringe';
import { Engine, Context, UtteranceRequest } from './engine';
import {
  Logger,
  ContextualCorrelator,
  EventEmitter,
  // These are all placeholders for now
  EntityQueries,
  EntityCommands,
  GuidelineMatcher,
  RelationalGuidelineResolver,
  ToolEventGenerator,
  MessageGenerator,
  CannedResponseGenerator,
  PerceivedPerformancePolicy,
  EngineHooks,
} from './types';

@injectable()
export class AlphaEngine implements Engine {
  constructor(
    @inject('Logger') private logger: Logger,
    @inject('ContextualCorrelator') private correlator: ContextualCorrelator,
    @inject('EntityQueries') private entityQueries: EntityQueries,
    @inject('EntityCommands') private entityCommands: EntityCommands,
    @inject('GuidelineMatcher') private guidelineMatcher: GuidelineMatcher,
    @inject('RelationalGuidelineResolver')
    private relationalGuidelineResolver: RelationalGuidelineResolver,
    @inject('ToolEventGenerator')
    private toolEventGenerator: ToolEventGenerator,
    @inject('MessageGenerator')
    private fluidMessageGenerator: MessageGenerator,
    @inject('CannedResponseGenerator')
    private cannedResponseGenerator: CannedResponseGenerator,
    @inject('PerceivedPerformancePolicy')
    private perceivedPerformancePolicy: PerceivedPerformancePolicy,
    @inject('EngineHooks') private hooks: EngineHooks
  ) {}

  async process(context: Context, event_emitter: EventEmitter): Promise<boolean> {
    this.logger.info(`Processing session ${context.session_id}`);
    // This is a placeholder implementation. The real implementation is very complex.
    return Promise.resolve(true);
  }

  async utter(
    context: Context,
    event_emitter: EventEmitter,
    requests: UtteranceRequest[]
  ): Promise<boolean> {
    this.logger.info(`Uttering in session ${context.session_id}`);
    // This is a placeholder implementation.
    return Promise.resolve(true);
  }
}
