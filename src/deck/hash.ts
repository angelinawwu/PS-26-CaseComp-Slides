/** 1-based slide number in the URL (`#1`, `#2`, …). */
export function readSlideIndex(count: number): number {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const n = Number.parseInt(raw, 10)
  if (Number.isFinite(n) && n >= 1 && n <= count) return n - 1
  return 0
}

export function writeSlideIndex(index: number, mode: 'push' | 'replace') {
  const next = `#${index + 1}`
  if (window.location.hash === next) return
  if (mode === 'push') history.pushState(null, '', next)
  else history.replaceState(null, '', next)
}
