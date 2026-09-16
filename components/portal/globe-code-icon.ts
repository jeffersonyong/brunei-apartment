import { createLucideIcon } from 'lucide-react'

/**
 * Lucide's `globe-code`, which arrived in a release after the one pinned here.
 *
 * Built with lucide's own factory from the published icon's paths (lucide
 * 1.46, ISC), so it takes the same props, classes and stroke rule as every
 * other icon in the portal. Delete this file and import `GlobeCode` from
 * `lucide-react` once the pin moves past it.
 */
export const GlobeCode = createLucideIcon('globe-code', [
  ['path', { d: 'M15.5 10 13 7.5 15.5 5', key: 'globe-code-left' }],
  [
    'path',
    {
      d: 'M15.861 14A14.5 14.5 0 0 1 12 22a14.48 14.48 0 0 1 0-20 10 10 0 1 0 9.888 11.5',
      key: 'globe-code-globe',
    },
  ],
  ['path', { d: 'M19.5 5 22 7.5 19.5 10', key: 'globe-code-right' }],
  ['path', { d: 'M2 12h8.5', key: 'globe-code-equator' }],
])
