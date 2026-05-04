import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDirectory, '..');
const repositoryRoot = resolve(webRoot, '..');
const sigilOutputRoot = resolve(repositoryRoot, '.local');
const generatedRoot = resolve(webRoot, 'src/generated');

const moduleDirectories = ['core', 'src', 'stdlib'];

const declarationFiles = [
  {
    relativePath: 'src/gameApi.d.mts',
    contents:
      'export function acknowledgeBrowserShell(autosave: string): Promise<unknown>;\n' +
      'export function advanceBrowserShell(autosave: string): Promise<unknown>;\n' +
      'export function bootstrap(): Promise<unknown>;\n' +
      'export function hydrateBrowserShell(autosave: string): Promise<unknown>;\n' +
      'export function launchBrowserMission(autosave: string): Promise<unknown>;\n' +
      'export function openMissionConfig(autosave: string): Promise<unknown>;\n' +
      'export function queueBrowserOrder(autosave: string, command: unknown): Promise<unknown>;\n' +
      'export function resetBrowserShell(): Promise<unknown>;\n' +
      'export function returnToContractLobby(autosave: string): Promise<unknown>;\n' +
      'export function returnToMissionConfig(autosave: string): Promise<unknown>;\n' +
      'export function selectBrowserContract(autosave: string, contractId: string): Promise<unknown>;\n' +
      'export function setBrowserEntryPlan(autosave: string, entryPlanId: string): Promise<unknown>;\n',
  },
  {
    relativePath: 'src/saveCodecs.d.mts',
    contents: 'export function parseSaveFile(input: string): Promise<unknown>;\n',
  },
];

function rewriteForVite(contents) {
  return contents.replaceAll(
    'import(modulePath)',
    'import(/* @vite-ignore */ modulePath)'
  );
}

execFileSync('sigil', ['compile', 'src/gameApi.lib.sigil'], {
  cwd: repositoryRoot,
  stdio: 'inherit',
});

rmSync(generatedRoot, { force: true, recursive: true });

for (const moduleDirectory of moduleDirectories) {
  const sourceDirectory = resolve(sigilOutputRoot, moduleDirectory);
  const targetDirectory = resolve(generatedRoot, moduleDirectory);

  mkdirSync(targetDirectory, { recursive: true });

  for (const entry of readdirSync(sourceDirectory)) {
    if (!entry.endsWith('.mjs')) {
      continue;
    }

    const sourcePath = resolve(sourceDirectory, entry);
    const targetPath = resolve(targetDirectory, entry);
    const contents = readFileSync(sourcePath, 'utf8');

    writeFileSync(targetPath, rewriteForVite(contents));
  }
}

for (const declarationFile of declarationFiles) {
  writeFileSync(resolve(generatedRoot, declarationFile.relativePath), declarationFile.contents);
}
