import request from 'supertest';
import app from '../../index';

describe('Tags API', () => {
  let tagId: string;

  it('should create a new tag', async () => {
    const res = await request(app)
      .post('/tags')
      .send({
        name: 'test-tag',
      });
    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('test-tag');
    tagId = res.body.id;
  });

  it('should get all tags', async () => {
    const res = await request(app).get('/tags');
    expect(res.status).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a tag by id', async () => {
    const res = await request(app).get(`/tags/${tagId}`);
    expect(res.status).toEqual(200);
    expect(res.body.id).toBe(tagId);
  });

  it('should update a tag', async () => {
    const res = await request(app)
      .patch(`/tags/${tagId}`)
      .send({
        name: 'updated-test-tag',
      });
    expect(res.status).toEqual(200);
    expect(res.body.name).toBe('updated-test-tag');
  });

  it('should delete a tag', async () => {
    const res = await request(app).delete(`/tags/${tagId}`);
    expect(res.status).toEqual(204);
  });

  it('should return 404 for a non-existent tag', async () => {
    const res = await request(app).get(`/tags/non-existent-id`);
    expect(res.status).toEqual(404);
  });
});
