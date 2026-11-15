import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verificationLink } from './links.js';
const project = 'https://example.supabase.co';
const callback = 'http://localhost:3000/';
const good = new URL('/auth/v1/verify', project);
good.search = new URLSearchParams({type:'signup',token:'example',redirect_to:callback});
test('selects the unique verification link from the signup email', () => {
  assert.equal(verificationLink(['mailto:help@example.org', good.href, good.href],project,callback), good.href);
});
for (const [name, change] of Object.entries({
  'wrong provider': url => { url.hostname = 'other.example'; },
  'wrong callback': url => url.searchParams.set('redirect_to','https://another.example/'),
  'wrong action': url => url.searchParams.set('type','recovery'),
  'missing token': url => url.searchParams.delete('token')
})) {
  test('rejects ' + name, () => {
    const url = new URL(good);
    change(url);
    assert.throws(() => verificationLink([url.href],project,callback));
  });
}
