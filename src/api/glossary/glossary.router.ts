import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTermDto, UpdateTermDto } from './glossary.dto';
import { GlossaryRepository } from './glossary.repository';

const router = Router();
const glossaryRepository = container.resolve(GlossaryRepository);

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
  validationMiddleware(CreateTermDto),
  async (req: Request, res: Response) => {
    try {
      const newTerm = await glossaryRepository.create(req.body);
      res.status(201).json(newTerm);
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
  const { tag_id } = req.query;
  const terms = await glossaryRepository.findAll(tag_id as string);
  res.json(terms);
});

router.get('/:termId', async (req: Request, res: Response) => {
  const term = await glossaryRepository.findById(req.params.termId);
  if (term) {
    res.json(term);
  } else {
    res.status(404).send('Term not found');
  }
});

router.patch(
  '/:termId',
  validationMiddleware(UpdateTermDto),
  async (req: Request, res: Response) => {
    try {
      const updatedTerm = await glossaryRepository.update(req.params.termId, req.body);
      res.json(updatedTerm);
    } catch (error: any) {
      if (error.message === 'Item not found') {
        res.status(404).send('Term not found');
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  }
);

router.delete('/:termId', async (req: Request, res: Response) => {
    try {
      await glossaryRepository.delete(req.params.termId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Item not found') {
        res.status(404).send('Term not found');
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
});

export default router;
