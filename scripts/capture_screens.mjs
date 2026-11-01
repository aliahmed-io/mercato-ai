import puppeteer from '../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'docs', 'images');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (!fs.existsSync(edgePath)) {
  console.error(`Edge executable not found at ${edgePath}`);
  process.exit(1);
}

const targets = [
  {
    url: 'http://localhost:3000/overview',
    file: 'current-overview.png',
    check: () => document.body.innerText.includes('Planning summary') && document.body.innerText.includes('Historical daily sales')
  },
  {
    url: 'http://localhost:3000/forecasting',
    file: 'current-forecasting.png',
    check: () => document.querySelectorAll('.recharts-surface').length > 0 || document.body.innerText.includes('Forecast summary')
  },
  {
    url: 'http://localhost:3000/inventory',
    file: 'current-inventory.png',
    check: () => document.querySelectorAll('table tbody tr').length > 0
  },
  {
    url: 'http://localhost:3000/analytics',
    file: 'current-analytics.png',
    check: () => document.querySelectorAll('.recharts-surface').length > 0 || document.querySelectorAll('table tbody tr').length > 0
  },
  {
    url: 'http://localhost:3000/models',
    file: 'current-models.png',
    check: () => document.body.innerText.includes('Model comparison matrix') || document.querySelectorAll('table tbody tr').length > 0
  },
  {
    url: 'http://localhost:3000/data',
    file: 'current-data.png',
    check: () => document.querySelectorAll('table tbody tr').length > 0 || document.body.innerText.includes('Catalog health')
  },
  {
    url: 'http://localhost:3000/reports',
    file: 'current-reports.png',
    check: () => document.body.innerText.includes('Executive summaries') || document.querySelectorAll('table tbody tr').length > 0
  },
  {
    url: 'http://localhost:3000',
    file: 'current-landing.png',
    check: () => document.body.innerText.includes('Equilibrium Engine')
  },
  {
    url: 'http://localhost:3000',
    file: 'redesign-desktop.png',
    check: () => document.body.innerText.includes('Equilibrium Engine')
  },
];

async function capture() {
  console.log('Launching Edge browser...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--hide-scrollbars',
      '--window-size=1440,900'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    for (const t of targets) {
      console.log(`Navigating to ${t.url} -> ${t.file}...`);
      try {
        await page.goto(t.url, { waitUntil: 'networkidle0', timeout: 30000 });
      } catch (e) {
        console.warn(`Networkidle0 warning on ${t.url}:`, e.message);
      }

      if (t.check) {
        try {
          await page.waitForFunction(t.check, { timeout: 15000 });
          console.log(`Data condition satisfied for ${t.file}`);
        } catch {
          console.warn(`waitForFunction timed out for ${t.file}`);
        }
      }

      // Allow 2 seconds for recharts SVG rendering and animations to fully settle
      await new Promise(r => setTimeout(r, 2000));

      const dest = path.join(outDir, t.file);
      await page.screenshot({ path: dest });
      const stats = fs.statSync(dest);
      console.log(`Saved ${t.file} (${stats.size} bytes)`);
    }

    // Capture mobile landing
    console.log('Capturing mobile view...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const mobileDest = path.join(outDir, 'redesign-mobile.png');
    await page.screenshot({ path: mobileDest });
    const mobileStats = fs.statSync(mobileDest);
    console.log(`Saved redesign-mobile.png (${mobileStats.size} bytes)`);

  } finally {
    await browser.close();
  }
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
