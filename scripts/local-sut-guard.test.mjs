import test from 'node:test';
import assert from 'node:assert/strict';
import { assertLoopbackUrl, isolatedSutTargets } from '../src/local-sut-guard.mjs';

test('mutation tests require explicit opt-in', () => {
  assert.throws(() => isolatedSutTargets({}), /LOCAL_SUT_MUTATION_ACK/);
});

test('default targets are isolated loopback services', () => {
  assert.deepEqual(isolatedSutTargets({ LOCAL_SUT_MUTATION_ACK: 'LOCAL_ONLY' }), {
    web: 'http://127.0.0.1:4200', api: 'http://127.0.0.1:8091',
  });
  assert.equal(assertLoopbackUrl('http://localhost:4200', 'web'), 'http://localhost:4200');
  assert.equal(assertLoopbackUrl('http://[::1]:8091', 'api'), 'http://[::1]:8091');
});

for (const url of [
  'https://localhost:4200',
  'https://practicesoftwaretesting.com',
  'http://api.practicesoftwaretesting.com',
  'http://localhost.evil.test',
  'http://192.168.1.10:8091',
  'http://127.0.0.2:8091',
  'http://localhost:4200/subpath',
  'http://localhost:4200/?unsafe=true',
  'http://user:password@localhost:8091',
  'file:///tmp/socket',
  'not-a-url',
]) {
  test(`rejects non-isolated target: ${url}`, () => {
    assert.throws(() => assertLoopbackUrl(url, 'target'));
  });
}
