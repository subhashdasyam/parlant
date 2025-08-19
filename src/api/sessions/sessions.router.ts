import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSessionDto, UpdateSessionDto, CreateEventDto } from './sessions.dto';
import { SessionRepository } from './sessions.repository';
import { Application } from '../../core/application';

const router = Router();
const sessionRepository = container.resolve(SessionRepository);
const application = container.resolve(Application);

// Middleware for validating DTOs
const validationMiddleware = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToClass(dtoClass, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      res.status(400).json({ errors });
    } else {
      req.body = dto;
      next();
    }
  };
};

router.post(
  '/',
  validationMiddleware(CreateSessionDto),
  async (req: Request, res: Response) => {
    try {
      const { agent_id, customer_id, title } = req.body;
      const newSession = await application.createCustomerSession(customer_id, agent_id, title);
      res.status(201).json(newSession);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).send(error.message);
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  }
);

router.get('/', async (req: Request, res: Response) => {
  const { agent_id, customer_id } = req.query;
  const sessions = await sessionRepository.findAll(agent_id as string, customer_id as string);
  res.json(sessions);
});

router.get('/:sessionId', async (req: Request, res: Response) => {
  const session = await sessionRepository.findById(req.params.sessionId);
  if (session) {
    res.json(session);
  } else {
    res.status(404).send('Session not found');
  }
});

router.patch(
  '/:sessionId',
  validationMiddleware(UpdateSessionDto),
  async (req: Request, res: Response) => {
    try {
      const updatedSession = await sessionRepository.update(req.params.sessionId, req.body);
      res.json(updatedSession);
    } catch (error: any) {
      if (error.message === 'Item not found') {
        res.status(404).send('Session not found');
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  }
);

router.delete('/:sessionId', async (req: Request, res: Response) => {
    try {
      await sessionRepository.delete(req.params.sessionId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Item not found') {
        res.status(404).send('Session not found');
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
});

router.post(
    '/:sessionId/events',
    validationMiddleware(CreateEventDto),
    async (req: Request, res: Response) => {
        try {
            // This is a simplified implementation. The real implementation would use the application service
            // to post and process the event.
            const newEvent = await sessionRepository.createEvent(req.params.sessionId, req.body);
            res.status(201).json(newEvent);
        } catch (error: any) {
            if (error.message.includes('not found')) {
                res.status(404).send(error.message);
            } else {
                res.status(500).send('Internal Server Error');
            }
        }
    }
);

router.get('/:sessionId/events', async (req: Request, res: Response) => {
    const events = await sessionRepository.findEvents(req.params.sessionId);
    res.json(events);
});

export default router;
