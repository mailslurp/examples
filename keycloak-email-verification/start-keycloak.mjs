import { spawn } from 'node:child_process';
import { join } from 'node:path';

// This Unix launcher always creates a loopback-only server with an in-memory database.
const env = { ...process.env };
delete env.MAILSLURP_API_KEY;
const child = spawn(join(env.KC_HOME, 'bin', 'kc.sh'), [
  'start-dev', '--http-host=127.0.0.1', '--http-port=38761', '--db=dev-mem'
], { env, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
