import test from 'node:test';
import assert from 'node:assert/strict';
import { recoveryLink } from './links.js';

const callback = 'http://localhost:4174/recover';
const valid = callback + '?userId=example&secret=sample';
test('finds one distinct callback among other email links', () => {
  assert.equal(recoveryLink(['invalid', 'https://appwrite.io', valid, valid], callback), valid);
});
for (const [reason, links] of Object.entries({
  origin: [valid.replace('localhost', 'example.org')],
  route: [valid.replace('/recover', '/other')],
  missingSecret: [callback + '?userId=example'],
  duplicateParameter: [valid + '&userId=other'],
  ambiguous: [valid, valid + '2']
})) {
  test('rejects ' + reason, () => assert.throws(() => recoveryLink(links, callback)));
}
