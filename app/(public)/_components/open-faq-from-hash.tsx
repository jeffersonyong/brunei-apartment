'use client'

import { useEffect } from 'react'

/**
 * Opens the answer an address points at — `/faq#how-do-i-pay`.
 *
 * The answers are collapsed, and staff send people a link to a single one over
 * WhatsApp. Without this the link lands on a closed question and the guest has
 * to find and open it themselves, which is the exact errand the link was meant
 * to spare them. Listens for a change of address too, so a link from one answer
 * to another on the same page opens its target.
 *
 * Renders nothing. With JavaScript off the link still scrolls to the question.
 */
export function OpenFaqFromHash() {
  useEffect(() => {
    function openTarget() {
      const id = decodeURIComponent(window.location.hash.slice(1))

      if (id === '') {
        return
      }

      const target = document.getElementById(id)

      if (target instanceof HTMLDetailsElement) {
        target.open = true
        target.scrollIntoView({ block: 'start' })
      }
    }

    openTarget()
    window.addEventListener('hashchange', openTarget)

    return () => window.removeEventListener('hashchange', openTarget)
  }, [])

  return null
}
