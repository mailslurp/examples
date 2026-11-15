import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verificationLink } from './links.js';
const project = 'https://example.supabase.co';
const callback = 'http://localhost:3000/';
const valid = new URL('/auth/v1/verify', project);
valid.search = new URLSearchParams({ token:'fixture', type:'recovery', redirect_to:callback });
test('selects a unique recovery link', () => {
  assert.equal(verificationLink([valid.href,valid.href],project,callback,'recovery'), valid.href);
});
for (const [key, value] of [['type','signup'],['redirect_to','https://example.org'],['token','']]) {
  test('rejects an unexpected ' + key, () => {
    const link = new URL(valid);
    link.searchParams.set(key,value);
    assert.throws(() => verificationLink([link.href],project,callback,'recovery'));
  });
}
test('rejects a different project', () => {
  assert.throws(() => verificationLink([valid.href], 'https://another.supabase.co',callback,'recovery'));
});
