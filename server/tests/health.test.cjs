const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../build/server/src/bootstrap');

test('foundation API exposes health only; forged roles do not unlock business data', async () => {
  const app = await createApp();
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const response = await fetch(base + '/api/health');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok', stage: 'foundation', businessApiEnabled: false });
    for (const path of ['/api/business', '/api/leaves', '/api/users']) {
      const denied = await fetch(base + path, { headers: { 'x-role': 'OWNER' } });
      assert.equal(denied.status, 404);
    }
  } finally { await app.close(); }
});
