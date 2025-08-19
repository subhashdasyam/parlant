import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateGuidelineDto, UpdateGuidelineDto } from './guidelines.dto';
import { GuidelineRepository } from './guidelines.repository';

const router = Router();
const guidelineRepository = container.resolve(GuidelineRepository);

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
  validationMiddleware(CreateGuidelineDto),
  async (req: Request, res: Response) => {
    try {
      const newGuideline = await guidelineRepository.create(req.body);
      res.status(201).json(newGuideline);
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
  const guidelines = await guidelineRepository.findAll(tag_id as string);
  res.json(guidelines);
});

router.get('/:guidelineId', async (req: Request, res: Response) => {
  // The original implementation returns relationships and tool associations.
  // This simplified version only returns the guideline.
  const guideline = await guidelineRepository.findById(req.params.guidelineId);
  if (guideline) {
    res.json(guideline);
  } else {
    res.status(404).send('Guideline not found');
  }
});

router.patch(
  '/:guidelineId',
  validationMiddleware(UpdateGuidelineDto),
  async (req: Request, res: Response) => {
    try {
      const updatedGuideline = await guidelineRepository.update(req.params.guidelineId, req.body);
      res.json(updatedGuideline);
    } catch (error: any) {
      if (error.message === 'Item not found') {
        res.status(404).send('Guideline not found');
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  }
);

router.delete('/:guidelineId', async (req: Request, res: Response) => {
    try {
      await guidelineRepository.delete(req.params.guidelineId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Item not found') {
        res.status(404).send('Guideline not found');
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
});

export default router;
