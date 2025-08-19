import request from 'supertest';
import app from '../../index';
import { AgentDto, CompositionMode } from './agents.dto';

describe('Agents API', () => {
  let agentId: string;

  it('should create a new agent', async () => {
    const res = await request(app)
      .post('/agents')
      .send({
        name: 'Test Agent',
        description: 'A test agent',
      });
    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test Agent');
    agentId = res.body.id;
  });

  it('should get all agents', async () => {
    const res = await request(app).get('/agents');
    expect(res.status).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get an agent by id', async () => {
    const res = await request(app).get(`/agents/${agentId}`);
    expect(res.status).toEqual(200);
    expect(res.body.id).toBe(agentId);
  });

  it('should update an agent', async () => {
    const res = await request(app)
      .patch(`/agents/${agentId}`)
      .send({
        name: 'Updated Test Agent',
        composition_mode: CompositionMode.CANNED_STRICT,
      });
    expect(res.status).toEqual(200);
    expect(res.body.name).toBe('Updated Test Agent');
    expect(res.body.composition_mode).toBe(CompositionMode.CANNED_STRICT);
  });

  it('should delete an agent', async () => {
    const res = await request(app).delete(`/agents/${agentId}`);
    expect(res.status).toEqual(204);
  });

  it('should return 404 for a non-existent agent', async () => {
    const res = await request(app).get(`/agents/non-existent-id`);
    expect(res.status).toEqual(404);
  });
});
