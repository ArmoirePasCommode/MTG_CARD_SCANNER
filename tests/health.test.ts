import request from 'supertest';
import { app } from '../src/server/app';

describe('Test route', () => {
  it('returns ok: true', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});


