import request from 'supertest';
import app from '../../index';
import { container } from 'tsyringe';
import { AgentRepository } from '../agents/agents.repository';

describe('Sessions API', () => {
  let sessionId: string;
  let agentId: string;

  beforeAll(async () => {
    // We need an agent to create a session
    const agentRepository = container.resolve(AgentRepository);
    const agent = await agentRepository.create({ name: 'Session Test Agent' });
    agentId = agent.id;
  });

  it('should create a new session', async () => {
    const res = await request(app)
      .post('/sessions')
      .send({
        agent_id: agentId,
      });
    expect(res.status).toEqual(201);
    expect(res.body).toHaveProperty('id');
    sessionId = res.body.id;
  });

  it('should get all sessions', async () => {
    const res = await request(app).get('/sessions');
    expect(res.status).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a session by id', async () => {
    const res = await request(app).get(`/sessions/${sessionId}`);
    expect(res.status).toEqual(200);
    expect(res.body.id).toBe(sessionId);
  });

  it('should delete a session', async () => {
    const res = await request(app).delete(`/sessions/${sessionId}`);
    expect(res.status).toEqual(204);
  });
});
