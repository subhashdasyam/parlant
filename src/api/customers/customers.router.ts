import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCustomerDto, UpdateCustomerDto } from './customers.dto';
import { CustomerRepository } from './customers.repository';

const router = Router();
const customerRepository = container.resolve(CustomerRepository);

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
  validationMiddleware(CreateCustomerDto),
  async (req: Request, res: Response) => {
    try {
      const newCustomer = await customerRepository.create(req.body);
      res.status(201).json(newCustomer);
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
  const customers = await customerRepository.findAll();
  res.json(customers);
});

router.get('/:customerId', async (req: Request, res: Response) => {
  const customer = await customerRepository.findById(req.params.customerId);
  if (customer) {
    res.json(customer);
  } else {
    res.status(404).send('Customer not found');
  }
});

router.patch(
  '/:customerId',
  validationMiddleware(UpdateCustomerDto),
  async (req: Request, res: Response) => {
    try {
      const updatedCustomer = await customerRepository.update(req.params.customerId, req.body);
      res.json(updatedCustomer);
    } catch (error: any) {
      if (error.message === 'Item not found') {
        res.status(404).send('Customer not found');
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
  }
);

router.delete('/:customerId', async (req: Request, res: Response) => {
    try {
      await customerRepository.delete(req.params.customerId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Item not found') {
        res.status(404).send('Customer not found');
      } else {
        res.status(500).send('Internal Server Error');
      }
    }
});

export default router;
