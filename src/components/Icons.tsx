// Line icons drawn for this site (24px grid, 1.5px stroke, currentColor).
type P = { className?: string }
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const IconCctv = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
    <path d="M3 7.5 15.5 4l2 6L5 13.5z" />
    <circle cx="13.6" cy="8.3" r="1.3" />
    <path d="M17.5 10 20 9.3M7 13l1.5 4.5H3M3 15v5" />
  </svg>
)
export const IconNetwork = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
    <rect x="9" y="3" width="6" height="5" rx="1" />
    <rect x="2.5" y="16" width="6" height="5" rx="1" />
    <rect x="15.5" y="16" width="6" height="5" rx="1" />
    <path d="M12 8v4M5.5 16v-4h13v4" />
  </svg>
)
export const IconWifiCam = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
    <circle cx="12" cy="13" r="6" />
    <circle cx="12" cy="13" r="2.2" />
    <path d="M9 21h6M12 19v2M8 4.5a6 6 0 0 1 8 0M9.8 6.6a3 3 0 0 1 4.4 0" />
  </svg>
)
export const IconAccess = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
    <rect x="5" y="2.5" width="14" height="19" rx="2" />
    <path d="M9 9.5a3 3 0 0 1 6 0v1M8.5 14c.5 2 1.8 3 3.5 3s3-1 3.5-3M12 11v3" />
  </svg>
)
export const IconAlarm = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
    <path d="M6 17V11a6 6 0 0 1 12 0v6M4 17h16M10 20h4" />
    <path d="M12 2v1.5M3.5 6 4.6 7M20.5 6l-1.1 1" />
  </svg>
)
export const IconWrench = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
    <path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-3 3-1.5-1.5-6 6a2.1 2.1 0 0 1-3-3l6-6L12 10l3-3z" />
    <path d="M3 3l5 5" />
  </svg>
)
export const IconArrow = ({ className }: P) => (
  <svg viewBox="0 0 24 24" width="18" height="18" className={className} {...base} aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
export const IconMenu = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...base} aria-hidden="true">
    {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
  </svg>
)

export const solutionIcons: Record<string, (p: P) => JSX.Element> = {
  cctv: IconCctv,
  network: IconNetwork,
  wifi: IconWifiCam,
  access: IconAccess,
  alarm: IconAlarm,
  amc: IconWrench,
}

const s18 = { width: 18, height: 18, ...base }
export const IconPlus = () => (
  <svg viewBox="0 0 24 24" {...s18} aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
)
export const IconMinus = () => (
  <svg viewBox="0 0 24 24" {...s18} aria-hidden="true"><path d="M5 12h14" /></svg>
)
export const IconClose = () => (
  <svg viewBox="0 0 24 24" {...s18} aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
)
export const IconSearch = () => (
  <svg viewBox="0 0 24 24" {...s18} aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
)
export const IconBag = () => (
  <svg viewBox="0 0 24 24" {...s18} aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
)
export const IconTrash = () => (
  <svg viewBox="0 0 24 24" {...s18} aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" /></svg>
)
export const IconCheck = () => (
  <svg viewBox="0 0 24 24" {...s18} aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
)
export const IconCalendar = () => (
  <svg viewBox="0 0 24 24" {...s18} aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
)

// brand marks (simplified, single colour)
export const IconFacebook = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21z" />
  </svg>
)
export const IconInstagram = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...base} aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
  </svg>
)
export const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5Zm0 17.3c-1.5 0-3-.4-4.2-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A7.8 7.8 0 1 1 12 19.8Zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.4 6.4 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z" />
  </svg>
)
export const IconPhone = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...base} aria-hidden="true">
    <path d="M5 4h3.5l1.5 4-2 1.3a10 10 0 0 0 6.7 6.7L16 14l4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />
  </svg>
)
export const IconStar = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
  </svg>
)
export const IconQuote = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
    <path d="M9.6 6C6.3 7 4 9.8 4 13.4V18h6v-6H7.2c.2-2 1.4-3.5 3.2-4.2zm10 0C16.3 7 14 9.8 14 13.4V18h6v-6h-2.8c.2-2 1.4-3.5 3.2-4.2z" />
  </svg>
)
