export type GroundBookingMethod = 'whatsapp' | 'online';

export interface GroundFormatRating {
  format: string;
  stars: number;
  note?: string;
}

export interface GroundPitchInfo {
  dimensions: string;
  dimensionsMetric: string;
  dimensionsNote?: string;
  playingArea: string;
  formatRatings: GroundFormatRating[];
}

export interface GroundOption {
  name: string;
  description?: string;
  pricePerHour: string;
  dimensions?: string;
  dimensionsMetric?: string;
  dimensionsNote?: string;
  playingArea?: string;
  formatRatings: GroundFormatRating[];
}

export interface GroundRateRow {
  label: string;
  price: string;
}

export interface GroundRateGroup {
  title: string;
  rows: GroundRateRow[];
}

export interface GroundPhoneContact {
  display: string;
  /** Digits only, with country code e.g. 918240508008 */
  number: string;
}

export interface GroundBookingLink {
  label: string;
  url: string;
}

export interface GroundVenue {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  mapsUrl: string;
  bookingMethod: GroundBookingMethod;
  /** Online booking page — full payment on site */
  bookingUrl?: string;
  /** Label for the booking site, e.g. Khelomore or Rosedale Plaza */
  bookingSiteLabel?: string;
  /** Extra online booking options (e.g. Khelomore + HIDCO) */
  bookingLinks?: GroundBookingLink[];
  /** Digits only, with country code e.g. 919749432152 */
  whatsappNumber?: string;
  phoneDisplay?: string;
  phoneContacts?: GroundPhoneContact[];
  sampleMessage?: string;
  steps: string[];
  notes?: string[];
  cancellationPolicy?: string;
  priceHint?: string;
  openingHours?: string;
  rateChart?: GroundRateGroup[];
  pitchInfo?: GroundPitchInfo;
  /** Multiple pitches at one venue (e.g. Ground 1 vs Ground 2) */
  grounds?: GroundOption[];
}

export const GROUND_VENUES: GroundVenue[] = [
  {
    id: 'turf-air-plaza-rosedale',
    name: 'Turf Air Plaza',
    location: 'Rosedale Plaza, New Town (opposite St. Xavier\'s University)',
    imageUrl: '/grounds/turf-air-plaza.png',
    mapsUrl: 'https://maps.app.goo.gl/XSbH2XCSAB1Foiz38',
    bookingMethod: 'online',
    bookingUrl: 'https://www.rosedaleplaza.com/product/turf-air-plaza-for-football/',
    bookingSiteLabel: 'Rosedale Plaza',
    whatsappNumber: '919831531369',
    phoneDisplay: '98315 31369',
    priceHint: 'From ₹1,250 per slot (~₹62.5/head for 20 players)',
    steps: [
      'Open Book online — choose Football, pick your date, then select your time slot(s).',
      'Add number of players (1–20). Slots after 5 PM are peak hour (+₹100 per 30 min).',
      'Pay in full at checkout. Cart holds slots for only 2 minutes — pay right away.',
      'Arrive 30 minutes before your slot. Booking confirmation comes by email/SMS.',
    ],
    notes: [
      '6:30 AM – 4:30 PM = normal hour slots. After 5:00 PM = peak (+₹100 per 30 min).',
      'Check-in 30 minutes before play. Max 20 players per booking.',
      'Full payment required when you book online.',
      'No football/bats provided. Soft canvas cricket/tennis ball only on cricket mat.',
      'No outside food, speakers, or celebrations on the turf.',
    ],
    cancellationPolicy:
      '50% refund Mon–Fri if you cancel at least one day before the slot. No refunds for Sat–Sun cancellations.',
    pitchInfo: {
      dimensions: '120 × 65 ft',
      dimensionsMetric: '≈ 36.5 × 20 m',
      dimensionsNote:
        'Estimated from the facility size and typical commercial 5-a-side turf specifications.',
      playingArea: '~7,800 sq ft (≈ 725 m²)',
      formatRatings: [
        { format: '5v5', stars: 5 },
        { format: '6v6', stars: 4 },
        { format: '7v7', stars: 2, note: 'Playable but crowded' },
      ],
    },
  },
  {
    id: 'axis-mall-newtown',
    name: 'Turf Air Plaza 2.0',
    location: 'Rooftop, Wonderland Park, Axis Mall, New Town',
    imageUrl: '/grounds/axis-mall-newtown.png',
    mapsUrl: 'https://maps.app.goo.gl/1YmrTWUgACxLLmbY6',
    bookingMethod: 'whatsapp',
    whatsappNumber: '919749432152',
    phoneDisplay: '97494 32152',
    openingHours: 'Open daily: 5:00 AM – 11:00 PM',
    sampleMessage:
      'Ground 2 (small), available hai kya for Friday, July 11 from 5–6:30 PM?',
    priceHint: 'From ₹1,500/hr (Ground 2) · Ground 1 ₹1,800/hr',
    steps: [
      'Open WhatsApp or call the ground contact.',
      'Say which ground you want — Ground 1 (large) or Ground 2 (small) — plus date and time.',
      'Wait for a yes — if they confirm, your slot is booked.',
    ],
    notes: [
      'Rooftop turf, fully netted — floodlights for evening slots.',
      'Ground 2 (small): 5v5 or 6v6 only — ₹1,500/hr. Best choice right now — turf in great shape.',
      'Ground 1 (large): 6v6 or 7v7 max — ₹1,800/hr. Not advisable in rainy season — no rubber infill on the surface at the moment.',
      'Book by WhatsApp or phone — no online checkout.',
    ],
    grounds: [
      {
        name: 'Ground 2 (small)',
        description:
          'Rooftop enclosed turf — shown in the photo above. Best choice at the moment.',
        pricePerHour: '₹1,500 per hour',
        dimensions: '~100 × 55 ft',
        dimensionsMetric: '≈ 30 × 17 m',
        playingArea: '~5,500 sq ft (≈ 510 m²)',
        formatRatings: [
          { format: '5v5', stars: 5 },
          { format: '6v6', stars: 4, note: 'Max format' },
        ],
      },
      {
        name: 'Ground 1 (large)',
        description:
          'Bigger pitch for 6v6–7v7. Not advisable in rainy season — no rubber infill on the surface right now.',
        pricePerHour: '₹1,800 per hour',
        formatRatings: [
          { format: '6v6', stars: 5 },
          { format: '7v7', stars: 4, note: 'Max format' },
        ],
      },
    ],
  },
  {
    id: 'akankha-turf-newtown',
    name: 'Akankha Futsal Ground',
    location: 'Action Area II, New Town (near Akankha More & Highland Woods), Kolkata 700135',
    imageUrl: '/grounds/akankha-turf-newtown.png',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Akankha+Futsal+Ground+Action+Area+II+New+Town+Kolkata+700135',
    bookingMethod: 'online',
    bookingLinks: [
      {
        label: 'Khelomore',
        url: 'https://www.khelomore.com/sports-venues/kolkata/akankha-turf-newtown,-action-area-2c/3895/book-slots',
      },
      {
        label: 'HIDCO',
        url: 'https://www.wbhidcoltd.com/futsal',
      },
    ],
    phoneContacts: [{ display: '82405 08008', number: '918240508008' }],
    openingHours:
      'Play: Tue–Sun 6:00 AM – 11:59 PM · Booking desk: 8:00 AM – 8:00 PM · Closed Mondays',
    priceHint: 'From ₹1,500/hr weekdays (day) · weekends from ₹2,000/hr',
    rateChart: [
      {
        title: 'Weekdays',
        rows: [
          { label: 'Day', price: '₹1,500 per hour' },
          { label: 'Night', price: '₹1,800 per hour' },
        ],
      },
      {
        title: 'Weekends',
        rows: [
          { label: 'Day', price: '₹2,000 per hour' },
          { label: 'Night', price: '₹2,200 per hour' },
        ],
      },
    ],
    steps: [
      'Book on Khelomore or the HIDCO futsal page — pick your date and time slot — or call during booking hours.',
      'Day vs night rates apply (see rate chart). Weekends cost more than weekdays.',
      'Monday is closed. Play hours run till midnight; phone booking is 8 AM – 8 PM.',
    ],
    notes: [
      'Enclosed futsal turf with floodlights — play till midnight Tue–Sun.',
      'Book on Khelomore, the HIDCO official futsal page, or call 82405 08008 between 8 AM and 8 PM.',
      'On-site: food stalls, kids play area, and public library (HIDCO campus).',
      'Monday closed.',
    ],
  },
];

export function getGroundVenue(id: string): GroundVenue | undefined {
  return GROUND_VENUES.find((venue) => venue.id === id);
}

export function whatsappUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function telUrl(number: string): string {
  return `tel:+${number}`;
}
