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
    name: 'Rosedale Turf Air Plaza',
    location: 'Rosedale Plaza, New Town (opposite St. Xavier\'s University)',
    imageUrl: '/grounds/turf-air-plaza.png',
    mapsUrl: 'https://maps.app.goo.gl/XSbH2XCSAB1Foiz38',
    bookingMethod: 'online',
    bookingUrl: 'https://www.rosedaleplaza.com/product/turf-air-plaza-for-football/',
    bookingSiteLabel: 'Rosedale Plaza',
    whatsappNumber: '919831531369',
    phoneDisplay: '98315 31369',
    priceHint: '₹2,500 per hour',
    steps: [
      'Open Book online — choose Football, pick your date, then select your time slot(s).',
      'Add number of players (1–20). Evening slots after 5 PM may cost more — check at checkout.',
      'Pay in full at checkout. Cart holds slots for only 2 minutes — pay right away.',
      'Arrive 30 minutes before your slot. Booking confirmation comes by email/SMS.',
    ],
    notes: [
      'Standard rate: ₹2,500 per hour.',
      'After 5:00 PM = peak pricing — check Rosedale Plaza for the exact slot rate.',
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
    priceHint: 'Ground 2 ₹1,500 per hour · Ground 1 ₹1,800 per hour',
    steps: [
      'Open WhatsApp or call the ground contact.',
      'Say which ground you want — Ground 1 (large) or Ground 2 (small) — plus date and time.',
      'Wait for a yes — if they confirm, your slot is booked.',
    ],
    notes: [
      'Rooftop turf, fully netted — floodlights for evening slots.',
      'Ground 2 (small): 5v5 or 6v6 only — ₹1,500 per hour. Best choice right now — turf in great shape.',
      'Ground 1 (large): 6v6 or 7v7 max — ₹1,800 per hour. Not advisable in rainy season — no rubber infill on the surface at the moment.',
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
    name: 'Akankha Turf',
    location: 'Action Area IIC, Reckjoani, New Town (near Akankha More), West Bengal 700161',
    imageUrl: '/grounds/akankha-turf-newtown.png',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Akankha+Turf+Action+Area+IIC+Reckjoani+Kolkata',
    bookingMethod: 'online',
    bookingLinks: [
      {
        label: 'Khelomore',
        url: 'https://www.khelomore.com/sports-venues/kolkata/akankha-turf-newtown,-action-area-2c/3895/book-slots',
      },
    ],
    phoneContacts: [
      { display: '82405 08008', number: '918240508008' },
      { display: '89101 16046', number: '918910116046' },
    ],
    openingHours:
      'Play: Tue–Sun 6:00 AM – 11:59 PM · Booking desk: 8:00 AM – 8:00 PM · Closed Mondays',
    priceHint: '₹1,500 per hour',
    steps: [
      'Book on Khelomore — pick your date and time slot — or call during booking hours.',
      'Pay the hourly rate shown when you book or confirm by phone.',
      'Monday is closed. Play hours run till midnight; phone booking is 8 AM – 8 PM.',
    ],
    notes: [
      '₹1,500 per hour.',
      'Enclosed turf with floodlights — good for evening slots.',
      'Book on Khelomore or call 82405 08008 / 89101 16046 between 8 AM and 8 PM.',
      'Monday closed. Turf playable 6 AM – 12 AM (midnight).',
    ],
  },
  {
    id: 'nova-turf-newtown',
    name: 'Nova Turf',
    location:
      'DD 257 Road, Street Number 279, DD Block, Action Area I, New Town (near The Newtown School, Gate 1)',
    imageUrl: '/grounds/nova-turf-newtown.png',
    mapsUrl: 'https://maps.app.goo.gl/JDQ76rUKLYpoBLWv6',
    bookingMethod: 'online',
    bookingUrl: 'https://hudle.in/venues/nova-turf-new-town/330662',
    bookingSiteLabel: 'Hudle',
    openingHours: 'Mon–Sat 8:00 AM – 4:30 PM · Closed Sundays',
    priceHint: '₹2,700 per hour (7v7 football)',
    steps: [
      'Open Book on Hudle — choose 7v7 Football (Turf), pick your date, then select your slot.',
      'Standard rate is ₹2,700 per hour — Hudle may show a 10% discount at checkout.',
      'Pay online to confirm. Arrive a few minutes early with your booking confirmation.',
    ],
    notes: [
      '₹2,700 per hour for 7v7 football.',
      'Open Mon–Sat 8:00 AM – 4:30 PM. Closed Sundays.',
      'Enclosed turf with floodlights and blue spectator seating.',
      '7v7 football turf — book on Hudle.',
      'Near The Newtown School, Gate Number 1, Action Area I.',
      'Closest metro: Salt Lake Sector 5 (~5.8 km).',
    ],
    pitchInfo: {
      dimensions: '7v7 football turf',
      dimensionsMetric: 'Full small-sided pitch',
      dimensionsNote: 'Listed on Hudle as 7v7 Football (Turf).',
      playingArea: 'Enclosed outdoor turf',
      formatRatings: [
        { format: '5v5', stars: 4 },
        { format: '6v6', stars: 5 },
        { format: '7v7', stars: 5, note: 'Primary format' },
      ],
    },
  },
  {
    id: 'v-play-chinarpark',
    name: 'V Play Chinarpark',
    location: 'PS Newtown Square, Atghara, Chinarmore, West Bengal 700136 (New Town Square)',
    imageUrl: '/grounds/v-play-chinarpark.png',
    mapsUrl: 'https://maps.app.goo.gl/tmsF2r89vYFnjPmU9',
    bookingMethod: 'online',
    bookingUrl:
      'https://www.district.in/sgw/play/buy/6a3e174118cd7b60ad0aaf97/turf%20football/',
    bookingSiteLabel: 'District',
    phoneDisplay: '92309 98563',
    phoneContacts: [{ display: '92309 98563', number: '919230998563' }],
    openingHours: 'Open daily · closes 11:30 PM',
    priceHint: '5v5 ₹1,700/hr · 7v7 ₹2,000/hr',
    steps: [
      'Open Book on District — pick Turf Football, choose your date and time slot.',
      'Select 5v5 or 7v7 — rates are ₹1,700 or ₹2,000 per hour respectively.',
      'Pay online to confirm. Arrive a few minutes early with your booking confirmation.',
    ],
    notes: [
      'Rooftop enclosed turf with floodlights — football and cricket.',
      '5v5: ₹1,700 per hour · 7v7: ₹2,000 per hour.',
      'Book on District or call 92309 98563 for queries.',
      'Located in New Town Square, Atghara (Chinarpark area).',
      'Also listed at vplay.in.',
    ],
    rateChart: [
      {
        title: 'Turf football',
        rows: [
          { label: '5v5', price: '₹1,700 / hour' },
          { label: '7v7', price: '₹2,000 / hour' },
        ],
      },
    ],
    pitchInfo: {
      dimensions: 'Rooftop enclosed turf',
      dimensionsMetric: '5v5 or 7v7 football',
      dimensionsNote: 'Netted rooftop box — good ground size per local reviews.',
      playingArea: 'New Town Square rooftop',
      formatRatings: [
        { format: '5v5', stars: 5, note: '₹1,700/hr' },
        { format: '6v6', stars: 4 },
        { format: '7v7', stars: 5, note: '₹2,000/hr' },
      ],
    },
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
