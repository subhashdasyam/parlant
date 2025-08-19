import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAgentDto, UpdateAgentDto } from './agents.dto';
import { AgentRepository } from './agents.repository';

const router = Router();
const agentRepository = container.resolve(AgentRepository);

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
  validationMiddleware(CreateAgentDto),
  async (req: Request, res: Response) => {
    try {
      const newAgent = await agentRepository.create(req.body);
      res.status(201).json(newAgent);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(400).send(error.message);
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  }
);

router.get('/', async (req: Request, res: Response) => {
  const agents = await agentRepository.findAll();
  res.json(agents);
});

router.get('/:agentId', async (req: Request, res: Response) => {
  const agent = await agentRepository.findById(req.params.agentId);
  if (agent) {
    res.json(agent);
  } else {
    res.status(404).send('Agent not found');
  }
});

router.patch(
  '/:agentId',
  validationMiddleware(UpdateAgentDto),
  async (req: Request, res: Response) => {
    try {
      const updatedAgent = await agentRepository.update(req.params.agentId, req.body);
      res.json(updatedAgent);
    } catch (error: any) {
      if (error.message === 'Item not found') {
        res.status(404).send('Agent not found');
      } else if (error.message.includes('not found')) {
        res.status(400).send(error.message);
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  }
);

router.delete('/:agentId', async (req: Request, res: Response) => {
  try {
    await agentRepository.delete(req.params.agentId);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Item not found') {
      // The python version first checks if the agent exists, so we replicate that.
      res.status(404).send('Agent not found');
    } else {
        res.status(500).send('Internal Server Error');
    }
  }
});

export default router;
