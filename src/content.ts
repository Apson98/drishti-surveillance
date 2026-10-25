// ---------------------------------------------------------------------------
// All editable site copy lives here. Change text, contact details or products
// in this one file — the components read from it.
// Products, categories and clients are managed from the Admin Panel (/#admin).
// ---------------------------------------------------------------------------

export const company = {
  name: 'Drishti Surveillance',
  tagline: 'CCTV · Networking · Security Systems',
  phone: '980-2260016', // calls and WhatsApp
  phoneIntl: '+9779802260016', // for tel: links
  whatsapp: '9779802260016', // digits only, with country code, for wa.me links
  email: 'drishtiofficial2024@gmail.com',
  address: 'Lazimpat, Kathmandu',
  hours: 'Sun – Fri, 9:30 AM – 6:30 PM',
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61561923832846',
    instagram: 'https://www.instagram.com/drishti_surveillances/',
  },
}

export const nav = [
  { label: 'Solutions', href: '#solutions' },
  { label: 'Shop', href: '#shop' },
  { label: 'Planning', href: '#coverage' },
  { label: 'Clients', href: '#clients' },
  { label: 'Contact', href: '#book' },
]

export const hero = {
  eyebrow: 'CCTV · Networking · Security systems in Nepal',
  title: ['Clear sight over', 'everything you protect.'],
  body:
    'Drishti Surveillance plans, installs and maintains CCTV and network systems for homes and businesses, built on Hikvision and EZVIZ hardware and set up so you can watch every camera from your phone.',
  primary: { label: 'Book an appointment', href: '#book' },
  secondary: { label: 'Browse the shop', href: '#shop' },
}

export type Solution = { id: string; title: string; body: string; points: string[] }

export const solutions: Solution[] = [
  {
    id: 'cctv',
    title: 'CCTV surveillance',
    body: 'IP and HD cameras with NVR or DVR recording, planned around your entrances, counters and blind spots.',
    points: ['2 MP to 8 MP (4K) cameras', 'Colour and IR night vision', 'Live view and playback on mobile'],
  },
  {
    id: 'network',
    title: 'Network infrastructure',
    body: 'Structured cabling, fibre links, managed switches and office Wi-Fi that keep cameras and staff online.',
    points: ['Cat6 and fibre cabling', 'PoE and managed switches', 'Rack setup and labelling'],
  },
  {
    id: 'wifi',
    title: 'Smart Wi-Fi cameras',
    body: 'EZVIZ plug-and-play cameras for homes, flats and small shops. No long cable runs needed.',
    points: ['Two-way talk', 'Human detection alerts', 'Cloud or SD card recording'],
  },
  {
    id: 'access',
    title: 'Access control & attendance',
    body: 'Card, fingerprint and face terminals for doors and staff attendance, linked to your records.',
    points: ['Face and fingerprint terminals', 'Electric door locks', 'Attendance reports'],
  },
  {
    id: 'alarm',
    title: 'Alarms & video intercom',
    body: 'Intrusion sensors, sirens and video door phones that tell you who is at the gate before you open it.',
    points: ['Door, window and motion sensors', 'Phone alerts and siren', 'Video door phones'],
  },
  {
    id: 'amc',
    title: 'Maintenance & AMC',
    body: 'Scheduled checks, cleaning, firmware updates and fast repair under an annual maintenance contract.',
    points: ['Health checks and cleaning', 'Hard disk and recording checks', 'Priority service visits'],
  },
]


export const process = [
  { title: 'Site survey', body: 'We visit, walk the site with you and note entrances, blind spots, lighting and cable routes.' },
  { title: 'Design & quote', body: 'You get a camera plan, the hardware list and one clear price, with no surprise extras later.' },
  { title: 'Installation', body: 'Neat cabling, mounted and focused cameras, recorder setup and mobile app configured on your phone.' },
  { title: 'Handover & support', body: 'We show you how to view and play back footage, then stay on call for service and maintenance.' },
]

export const services = solutions.map((s) => s.title)
