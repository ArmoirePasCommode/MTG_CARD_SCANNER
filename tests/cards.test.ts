import request from 'supertest';
import { app } from '../src/server/app';

describe('Card routes', () => {
  it('requires auth', async () => {
    const res = await request(app).get('/api/cards');
    expect(res.status).toBe(401);
  });
});


