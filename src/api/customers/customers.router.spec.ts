import request from 'supertest';
import app from '../../index';

describe('Customers API', () => {
  let customerId: string;

  it('should create a new customer', async () => {
    const res = await request(app)
      .post('/customers')
      .send({
        name: 'Test Customer',
        metadata: { key: 'value' },
      });
    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test Customer');
    customerId = res.body.id;
  });

  it('should get all customers', async () => {
    const res = await request(app).get('/customers');
    expect(res.status).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a customer by id', async () => {
    const res = await request(app).get(`/customers/${customerId}`);
    expect(res.status).toEqual(200);
    expect(res.body.id).toBe(customerId);
  });

  it('should update a customer', async () => {
    const res = await request(app)
      .patch(`/customers/${customerId}`)
      .send({
        name: 'Updated Test Customer',
      });
    expect(res.status).toEqual(200);
    expect(res.body.name).toBe('Updated Test Customer');
  });

  it('should delete a customer', async () => {
    const res = await request(app).delete(`/customers/${customerId}`);
    expect(res.status).toEqual(204);
  });
});
