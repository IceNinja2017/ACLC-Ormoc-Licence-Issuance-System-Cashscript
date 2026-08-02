import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { compileString } from 'cashc';

const contracts = [
  { source: 'contracts/Issuer.cash', artifact: 'contracts/artifacts/Issuer.json' },
  { source: 'contracts/LicenseVault.cash', artifact: 'contracts/artifacts/LicenseVault.json' },
];

for (const { source, artifact } of contracts) {
  try {
    const sourcePath = resolve(source);
    const artifactPath = resolve(artifact);
    const sourceCode = await readFile(sourcePath, 'utf8');
    const artifactJson = compileString(sourceCode);
    await mkdir(dirname(artifactPath), { recursive: true });
    await writeFile(artifactPath, JSON.stringify(artifactJson, null, 2));
    console.log(`Compiled ${sourcePath} -> ${artifactPath}`);
  } catch (error) {
    console.error(`Compilation failed for ${source}:`);
    console.error(error);
    process.exitCode = 1;
  }
}