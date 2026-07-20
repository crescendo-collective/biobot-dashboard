import type { TrackerGroup } from '@/components/layout/Sidebar'

export const pathogens: TrackerGroup = {
  items: [
    { id: 'sars-cov-2', label: 'SARS-CoV-2' },
    { id: 'rsv', label: 'RSV' },
    { id: 'flu-a', label: 'Influenza A' },
    { id: 'norovirus', label: 'Norovirus' },
    { id: 'flu-b', label: 'Influenza B' },
    { id: 'adenovirus', label: 'Adenovirus' },
    { id: 'enterovirus', label: 'Enterovirus' },
    { id: 'rhinovirus', label: 'Rhinovirus' },
    { id: 'parainfluenza', label: 'Parainfluenza' },
    { id: 'rotavirus', label: 'Rotavirus' },
  ],
}

/** URL slug used for the "/" → "/:disease" default redirect, and for
 * any unrecognized :disease value (see Dashboard.tsx). Hardcoded to
 * 'rsv' rather than derived from list order — this is a deliberate
 * product choice ("default should be RSV"), not "whatever's first". */
export const DEFAULT_DISEASE_ID = 'rsv'

if (import.meta.env.DEV && !pathogens.items.some((item) => item.id === DEFAULT_DISEASE_ID)) {
  // Dev-only guardrail: if 'rsv' ever gets renamed/removed from the
  // pathogens list above, every unknown-disease redirect would silently
  // point at a URL that itself doesn't match anything.
  console.warn(
    `DEFAULT_DISEASE_ID "${DEFAULT_DISEASE_ID}" is not in pathogens.items — check src/data/trackers.ts`,
  )
}
