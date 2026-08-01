import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { compileString } from 'cashc';

const sourcePath = resolve('contracts/License.cash');
const artifactPath = resolve('src/contracts/License.json');

try {
  const source = await readFile(sourcePath, 'utf8');
  const artifact = compileString(source);
  await mkdir(dirname(artifactPath), { recursive: true });
  await writeFile(artifactPath, JSON.stringify(artifact, null, 2));
  console.log(`Compiled ${sourcePath} -> ${artifactPath}`);
} catch (error) {
  console.error('CashScript compilation failed. See the location above.');
  console.error(error);
  process.exitCode = 1;
}
