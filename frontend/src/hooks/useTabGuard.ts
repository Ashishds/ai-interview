import { useEffect, useRef, useState } from 'react'

export type TabSwitchSeverity = 'none' | 'warning' | 'critical' | 'terminated'

export interface TabGuardStatus {
  /** Total number of times the candidate has switched away from this tab */
  switchCount: number
  /** True while the candidate is currently on another tab */
  isHidden: boolean
  /** Severity level — drives the UI response */
  severity: TabSwitchSeverity
  /** Timestamp of the most recent tab switch */
  lastSwitchAt: Date | null
}

/**
 * useTabGuard — Detects tab-switching during an AI interview session.
 *
 * Uses the Page Visibility API (document.visibilitychange) which fires reliably
 * when a candidate switches browser tabs or minimizes the window.
 *
 * Severity levels:
 *  'none'       → 0 switches (no violation)
 *  'warning'    → Strike 1 (yellow banner)
 *  'critical'   → Strike 2 (orange/red banner)
 *  'terminated' → Strike 3+ (session auto-terminated)
 *
 * @param active - Only count switches when true (should be `hasStarted`)
 */
export function useTabGuard(active: boolean): TabGuardStatus {
  const [status, setStatus] = useState<TabGuardStatus>({
    switchCount: 0,
    isHidden: false,
    severity: 'none',
    lastSwitchAt: null,
  })

  // Ref for count — avoids stale closure inside the event listener
  const switchCountRef = useRef(0)
  // Debounce: ignore events within 800ms (covers OS notification banners)
  const lastEventTimeRef = useRef(0)
  const DEBOUNCE_MS = 800

  useEffect(() => {
    // SSR guard — document is only available in the browser
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      if (!active) return

      const now = Date.now()
      if (now - lastEventTimeRef.current < DEBOUNCE_MS) return
      lastEventTimeRef.current = now

      if (document.hidden) {
        // Candidate switched away
        switchCountRef.current += 1
        const count = switchCountRef.current

        let severity: TabSwitchSeverity
        if (count >= 3) severity = 'terminated'
        else if (count === 2) severity = 'critical'
        else severity = 'warning'

        setStatus({ switchCount: count, isHidden: true, severity, lastSwitchAt: new Date() })
      } else {
        // Candidate came back — keep severity/count, just clear isHidden
        setStatus(prev => ({ ...prev, isHidden: false }))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [active]) // Re-register whenever active changes

  return status
}
