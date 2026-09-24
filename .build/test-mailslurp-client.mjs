import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const expectedVersion = '17.6.0';
const directories = [root, ...readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
  .map((entry) => join(root, entry.name))];
let checked = 0;

for (const directory of directories) {
  const manifestPath = join(directory, 'package.json');
  if (!existsSync(manifestPath)) continue;
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const version = manifest.dependencies?.['mailslurp-client'] ?? manifest.devDependencies?.['mailslurp-client'];
  if (!version) continue;
  assert.ok([expectedVersion, `^${expectedVersion}`, `~${expectedVersion}`].includes(version), manifestPath);

  const require = createRequire(manifestPath);
  const installed = require('mailslurp-client/package.json');
  assert.equal(installed.version, expectedVersion, manifestPath);
  const { MailSlurp } = require('mailslurp-client');
  const esm = await import(pathToFileURL(require.resolve('mailslurp-client')).href);
  assert.equal(esm.MailSlurp, MailSlurp, 'CommonJS and native ESM must expose the same named class');

  const requests = [];
  const client = new MailSlurp({
    apiKey: 'local-compatibility-check',
    basePath: 'https://example.invalid',
    fetchApi: async (url, init) => {
      requests.push({ url, init });
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });
  await client.userController.getUserInfoRaw();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://example.invalid/user/info');
  assert.equal(requests[0].init.headers['x-api-key'], 'local-compatibility-check');
  for (const field of ['inboxController', 'emailController', 'waitController', 'phoneController', 'devicePreviewsController']) {
    assert.ok(client[field], field);
  }
  checked += 1;
}

assert.ok(checked > 0, 'No SDK consumers found');
console.log(`MailSlurp ${expectedVersion}: ${checked} manifests, CommonJS/ESM imports, controllers, and custom fetch checks passed.`);
