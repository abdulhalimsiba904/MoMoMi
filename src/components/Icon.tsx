import type { ReactNode } from 'react'

export type IconName = 'grid' | 'arrow-down' | 'arrow-up' | 'box' | 'layers' | 'chart' | 'pulse' | 'spark' | 'bell' | 'chevron' | 'clock' | 'close' | 'arrowRight' | 'check' | 'search' | 'info'

const paths: Record<IconName, ReactNode> = {
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></>,
  'arrow-down': <><path d="M12 4v15"/><path d="m6 13 6 6 6-6"/></>,
  'arrow-up': <><path d="M12 20V5"/><path d="m6 11 6-6 6 6"/></>,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v9"/></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
  chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 6-7"/></>,
  pulse: <path d="M3 12h4l3-8 5 16 3-8h3"/>,
  spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
}

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
