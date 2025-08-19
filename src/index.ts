import 'reflect-metadata';
import express, { Express, Request, Response } from 'express';
import winston from 'winston';
import { container } from 'tsyringe';
import agentsRouter from './api/agents/agents.router';
import tagsRouter from './api/tags/tags.router';
import sessionsRouter from './api/sessions/sessions.router';
import guidelinesRouter from './api/guidelines/guidelines.router';
import glossaryRouter from './api/glossary/glossary.router';
import customersRouter from './api/customers/customers.router';
import { CustomerRepository } from './api/customers/customers.repository';
import { AgentRepository } from './api/agents/agents.repository';
import { TagRepository } from './api/tags/tags.repository';
import { SessionRepository } from './api/sessions/sessions.repository';
import { GuidelineRepository } from './api/guidelines/guidelines.repository';
import { GlossaryRepository } from './api/glossary/glossary.repository';
import { Application } from './core/application';
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
} from './core/types';
import { AlphaEngine } from './core/alpha-engine';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Register repositories and services with the container
container.register<Logger>('Logger', { useValue: logger });
container.register<ContextualCorrelator>('ContextualCorrelator', { useValue: { scope: (name, data, fn) => fn(), correlation_id: 'test' } });
container.register<SessionStore>('SessionStore', { useClass: SessionRepository });
container.register<SessionListener>('SessionListener', { useValue: { wait_for_events: async () => true } });
container.register<GuidelineStore>('GuidelineStore', { useClass: GuidelineRepository });
container.register<GuidelineToolAssociationStore>('GuidelineToolAssociationStore', { useValue: {} });
container.register<RelationshipStore>('RelationshipStore', { useValue: {} });
container.register<JourneyStore>('JourneyStore', { useValue: {} });
container.register<Engine>('Engine', { useClass: AlphaEngine });
container.register<EventEmitterFactory>('EventEmitterFactory', { useValue: {} });
container.register<BackgroundTaskService>('BackgroundTaskService', { useValue: {} });
container.register<CustomerRepository>('CustomerRepository', { useClass: CustomerRepository });
container.register<AgentRepository>('AgentRepository', { useClass: AgentRepository });
container.register<TagRepository>('TagRepository', { useClass: TagRepository });
container.register<GlossaryRepository>('GlossaryRepository', { useClass: GlossaryRepository });
container.register<Application>('Application', { useClass: Application });


const app: Express = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Parlant-TS!');
});

app.use('/agents', agentsRouter);
app.use('/tags', tagsRouter);
app.use('/sessions', sessionsRouter);
app.use('/guidelines', guidelinesRouter);
app.use('/glossary', glossaryRouter);
app.use('/customers', customersRouter);


// Only listen if not in a test environment
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        logger.info(`Server is running at http://localhost:${port}`);
    });
}

export default app;
