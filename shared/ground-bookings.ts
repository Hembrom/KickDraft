export interface GroundVenue {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  mapsUrl: string;
  /** Digits only, with country code for WhatsApp e.g. 919749432152 */
  whatsappNumber: string;
  /** Display phone e.g. 97494 32152 */
  phoneDisplay: string;
  sampleMessage: string;
  steps: string[];
}

export const GROUND_VENUES: GroundVenue[] = [
  {
    id: 'axis-mall-newtown',
    name: 'Axis Mall',
    location: 'New Town, Kolkata',
    imageUrl: '/grounds/axis-mall-newtown.svg',
    mapsUrl: 'https://maps.app.goo.gl/1YmrTWUgACxLLmbY6',
    whatsappNumber: '919749432152',
    phoneDisplay: '97494 32152',
    sampleMessage:
      'Ground 2 ( small ) , avaibla hai kya for Friday , July 11 from 5-6:30 PM ?',
    steps: [
      'Open WhatsApp or call the ground contact below.',
      'Send the sample message — change the date, time, and ground size if needed.',
      'Wait for a yes — if they confirm, your slot is booked.',
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
