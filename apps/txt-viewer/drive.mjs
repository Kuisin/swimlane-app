import { _electron as electron } from 'playwright-core';
import path from 'path';
import { fileURLToPath } from 'url';

const APP_DIR = path.dirname(fileURLToPath(import.meta.url));
const FOLDER = '/Users/kaiseisawada/Library/CloudStorage/OneDrive-Personal/ABeam/workflows-txt';
const electronBin = path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron');

const app = await electron.launch({ executablePath: electronBin, args: [APP_DIR], timeout: 30_000 });
await new Promise(r => setTimeout(r, 2500));
const page = app.windows()[0] ?? await app.firstWindow();

page.on('console', msg => console.log(`[${msg.type()}]`, msg.text()));
page.on('pageerror', err => console.log('[error]', err.message));

// Actually test if the mock call returns the mocked value
await page.evaluate((f) => { window.api.selectFolder = () => Promise.resolve(f); }, FOLDER);
const mockResult = await page.evaluate(() => window.api.selectFolder());
console.log('Mock result:', mockResult); // should be the FOLDER path if mock works

// If mock works, click the button
if (mockResult === FOLDER) {
  console.log('Mock works — clicking button');
  await page.evaluate(() => document.getElementById('btn-open-empty').click());
  await page.waitForSelector('#sidebar:not(.hidden)', { timeout: 30_000 });
  await new Promise(r => setTimeout(r, 8000));
  await page.screenshot({ path: '/tmp/shots/fixed-01-main.png' });
  console.log('fixed-01-main.png saved');
} else {
  console.log('Mock FAILED — trying direct loadFolder call via IPC');
  // Directly drive the load without the dialog by calling IPC manually
  const loaded = await page.evaluate(async (folder) => {
    try {
      const files = await window.api.readTxtFiles(folder);
      // Set folderPath in DOM
      document.getElementById('folder-path').textContent = folder;
      return { ok: true, files: files.map(f => f.name) };
    } catch(e) { return { ok: false, e: e.message }; }
  }, FOLDER);
  console.log('Direct IPC result:', JSON.stringify(loaded));
}
