import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTagDto, UpdateTagDto } from './tags.dto';
import { TagRepository } from './tags.repository';

const router = Router();
const tagRepository = container.resolve(TagRepository);

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
  validationMiddleware(CreateTagDto),
  async (req: Request, res: Response) => {
    const newTag = await tagRepository.create(req.body);
    res.status(201).json(newTag);
  }
);

router.get('/', async (req: Request, res: Response) => {
  const tags = await tagRepository.findAll();
  res.json(tags);
});

router.get('/:tagId', async (req: Request, res: Response) => {
  const tag = await tagRepository.findById(req.params.tagId);
  if (tag) {
    res.json(tag);
  } else {
    res.status(404).send('Tag not found');
  }
});

router.patch(
  '/:tagId',
  validationMiddleware(UpdateTagDto),
  async (req: Request, res: Response) => {
    try {
      const updatedTag = await tagRepository.update(req.params.tagId, req.body);
      res.json(updatedTag);
    } catch (error: any) {
      if (error.message === 'Item not found') {
        res.status(404).send('Tag not found');
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  }
);

router.delete('/:tagId', async (req: Request, res: Response) => {
  try {
    await tagRepository.delete(req.params.tagId);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Item not found') {
      res.status(404).send('Tag not found');
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
});

export default router;
