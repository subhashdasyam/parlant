import request from 'supertest';
import app from '../../index';

describe('Guidelines API', () => {
  let guidelineId: string;

  it('should create a new guideline', async () => {
    const res = await request(app)
      .post('/guidelines')
      .send({
        condition: 'Test condition',
        action: 'Test action',
      });
    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.condition).toBe('Test condition');
    guidelineId = res.body.id;
  });

  it('should get all guidelines', async () => {
    const res = await request(app).get('/guidelines');
    expect(res.status).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a guideline by id', async () => {
    const res = await request(app).get(`/guidelines/${guidelineId}`);
    expect(res.status).toEqual(200);
    expect(res.body.id).toBe(guidelineId);
  });

  it('should update a guideline', async () => {
    const res = await request(app)
      .patch(`/guidelines/${guidelineId}`)
      .send({
        condition: 'Updated Test Condition',
      });
    expect(res.status).toEqual(200);
    expect(res.body.condition).toBe('Updated Test Condition');
  });

  it('should delete a guideline', async () => {
    const res = await request(app).delete(`/guidelines/${guidelineId}`);
    expect(res.status).toEqual(204);
  });
});
