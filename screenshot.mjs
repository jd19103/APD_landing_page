import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';

const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

function nextIndex() {
  const files = fs.readdirSync(screenshotDir);
  let max = 0;
  for (const f of files) {
    const m = f.match(/^screenshot-(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max + 1;
}

const n        = nextIndex();
const filename = `screenshot-${n}${label}.png`;
const outPath  = path.join(screenshotDir, filename);

// Try to import puppeteer
let puppeteer;
try {
  puppeteer = (await import('puppeteer')).default;
} catch {
  console.error('puppeteer not found. Run: npm install puppeteer');
  process.exit(1);
}

const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:/Users/nateh/AppData/Local/Temp/puppeteer-test/chrome/win64-131.0.6778.204/chrome-win64/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
];

let executablePath;
for (const p of chromePaths) {
  if (fs.existsSync(p)) { executablePath = p; break; }
}

const launchOpts = {
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};
if (executablePath) launchOpts.executablePath = executablePath;

const browser = await puppeteer.launch(launchOpts);
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`✓ Screenshot saved: temporary screenshots/${filename}`);
