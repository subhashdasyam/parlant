import request from 'supertest';
import app from '../../index';

describe('Glossary API', () => {
  let termId: string;

  it('should create a new term', async () => {
    const res = await request(app)
      .post('/glossary')
      .send({
        name: 'Test Term',
        description: 'A test term',
        synonyms: ['test', 'term'],
      });
    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test Term');
    termId = res.body.id;
  });

  it('should get all terms', async () => {
    const res = await request(app).get('/glossary');
    expect(res.status).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a term by id', async () => {
    const res = await request(app).get(`/glossary/${termId}`);
    expect(res.status).toEqual(200);
    expect(res.body.id).toBe(termId);
  });

  it('should update a term', async () => {
    const res = await request(app)
      .patch(`/glossary/${termId}`)
      .send({
        name: 'Updated Test Term',
      });
    expect(res.status).toEqual(200);
    expect(res.body.name).toBe('Updated Test Term');
  });

  it('should delete a term', async () => {
    const res = await request(app).delete(`/glossary/${termId}`);
    expect(res.status).toEqual(204);
  });
});
