/*
 * Pulls Ansu's Duolingo Connect prototype into the deck, and photographs it.
 *
 * 1. Copies the single-file demo (`Ansu's MVP/demo/duolingo-connect-demo.html`)
 *    to public/assets/connect/connect.html, which the demo slide runs live.
 * 2. Drives it through a call in Chromium and saves the phone, cut out on a
 *    transparent background, to public/assets/connect/*.png. Slides that show
 *    a screen use these; so do thumbnails and stills of the demo slide.
 *
 * Rerun whenever the prototype changes (`npx vite build` in Ansu's MVP first):
 *
 *   npm run connect
 *   CONNECT_HTML=/path/to/duolingo-connect-demo.html npm run connect
 */
import { chromium } from 'playwright-core'
import { copyFile, mkdir } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SOURCE =
  process.env.CONNECT_HTML ??
  fileURLToPath(new URL("../../Duolingo-PS-2026-CaseComp/Ansu's MVP/demo/duolingo-connect-demo.html", import.meta.url))
const OUT = fileURLToPath(new URL('../public/assets/connect/', import.meta.url))

await mkdir(OUT, { recursive: true })
await copyFile(SOURCE, `${OUT}connect.html`)
console.log('public/assets/connect/connect.html')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 600, height: 1000 }, deviceScaleFactor: 2 })
await page.goto(pathToFileURL(SOURCE).href)
await page.waitForTimeout(1200)
// The phone alone: no presenter panel, nothing behind its rounded corners, and
// no shadow (it would fill the corners of the cut-out; the deck draws its own).
await page.addStyleTag({
  content:
    'aside, .fixed { display: none !important } body, #root > div { background: transparent !important } [class*="rounded-[56px]"] { box-shadow: none !important }',
})
const phone = page.locator('[class*="rounded-[56px]"]')
const shot = async (name) => {
  await page.waitForTimeout(300)
  await phone.screenshot({ path: `${OUT}${name}.png`, omitBackground: true })
  console.log(`public/assets/connect/${name}.png`)
}
const press = async (key, wait) => {
  await page.keyboard.press(key)
  await page.waitForTimeout(wait)
}

await shot('home')
await press('p', 900)
await shot('precall')
await page.getByRole('button', { name: /find a partner/i }).last().click()
await page.waitForTimeout(1500)
await shot('matching')
await page.waitForTimeout(5500)
await shot('call')
await press('g', 6000)
await shot('guardian')
// One line said, so hanging up lands on the recap rather than home.
await page.getByRole('button', { name: /how your day is going/i }).first().click().catch(() => {})
await page.waitForTimeout(9000)
await press('Escape', 1500)
await shot('recap')
await press('Escape', 800)
await press('l', 6000)
await shot('lily')
await press('Escape', 800)
await press('Escape', 800)
await page.getByRole('button', { name: /safety/i }).last().click()
await page.waitForTimeout(800)
await shot('safety')

await browser.close()
