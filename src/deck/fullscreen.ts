import { useCallback, useEffect, useState } from 'react'

/**
 * Browser fullscreen for the whole page: no tabs, no address bar, no OS chrome.
 *
 * The state follows `fullscreenchange` rather than our own calls, so leaving
 * with Esc (which the browser handles and never reports as a keydown) still
 * brings the handle back.
 */
export function useFullscreen() {
  const supported = typeof document !== 'undefined' && document.fullscreenEnabled
  const [active, setActive] = useState(
    () => typeof document !== 'undefined' && document.fullscreenElement !== null,
  )

  useEffect(() => {
    const onChange = () => setActive(document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = useCallback(() => {
    if (!supported) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => {})
  }, [supported])

  return { supported, active, toggle }
}
