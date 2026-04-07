import { mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';

const hookPath = join(process.cwd(), '.git', 'hooks', 'pre-commit');
const hookScript = `#!/usr/bin/env sh

if ! npm run typecheck; then
  echo "Type check failed. Commit aborted."
  exit 1
fi
`;

try {
  mkdirSync(dirname(hookPath), { recursive: true });
  writeFileSync(hookPath, hookScript, { encoding: 'utf8' });
  chmodSync(hookPath, 0o755);
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('Unable to install git pre-commit hook:', error.message);
}
