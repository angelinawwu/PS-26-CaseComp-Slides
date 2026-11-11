/*
 * Stills: one PNG per slide, every stepped slide finished (`?final`), into
 * export/. For a PDF backup, a submission that wants images, or a quick look
 * at the whole deck. The dev server must be running (npm run dev). Uses
 * Playwright's Chromium: `npx playwright-core install chromium` once if it
 * isn't installed.
 *
 *   npm run export
 *   DECK_URL=http://localhost:5197 npm run export   (if Vite picked another port)
 */
import { chromium } from 'playwright-core'
import { mkdir, rm } from 'node:fs/promises'

const DECK = process.env.DECK_URL ?? 'http://localhost:5196'
const OUT = new URL('../export/', import.meta.url).pathname

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

// The peek draws one dot per slide in play, so it is the deck's own count.
await page.goto(`${DECK}/?final#1`, { waitUntil: 'networkidle' })
const count = await page.locator('.route-peek i').count()

for (let n = 1; n <= count; n++) {
  await page.goto(`${DECK}/?final#${n}`)
  await page.reload({ waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1200)
  // Only the slide: no path peek, no handles.
  await page.addStyleTag({ content: '.route-peek, .edit-handle, .fullscreen-handle, .keep-handle { display: none !important; }' })
  const id = await page.locator('.slide-shell-enter').getAttribute('data-slide')
  const file = `${OUT}${String(n).padStart(2, '0')}-${id}.png`
  await page.locator('.stage').screenshot({ path: file })
  console.log(file.replace(OUT, 'export/'))
}
await browser.close()
