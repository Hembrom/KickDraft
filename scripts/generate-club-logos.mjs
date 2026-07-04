import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'public/clubs');

const CLUBS = [
  { id: 'real-madrid', abbr: 'RM', primary: '#FEBE10', secondary: '#00529F' },
  { id: 'barcelona', abbr: 'BAR', primary: '#A50044', secondary: '#004D98' },
  { id: 'atletico-madrid', abbr: 'ATM', primary: '#CB3524', secondary: '#272E61' },
  { id: 'sevilla', abbr: 'SEV', primary: '#D0103A', secondary: '#FFFFFF' },
  { id: 'manchester-united', abbr: 'MU', primary: '#DA291C', secondary: '#FBE122' },
  { id: 'manchester-city', abbr: 'MC', primary: '#6CABDD', secondary: '#1C2C5B' },
  { id: 'liverpool', abbr: 'LIV', primary: '#C8102E', secondary: '#00B2A9' },
  { id: 'chelsea', abbr: 'CHE', primary: '#034694', secondary: '#FFFFFF' },
  { id: 'arsenal', abbr: 'ARS', primary: '#EF0107', secondary: '#FFFFFF' },
  { id: 'tottenham', abbr: 'TOT', primary: '#132257', secondary: '#FFFFFF' },
  { id: 'newcastle', abbr: 'NEW', primary: '#241F20', secondary: '#FFFFFF' },
  { id: 'aston-villa', abbr: 'AVL', primary: '#95BFE5', secondary: '#670E36' },
  { id: 'west-ham', abbr: 'WHU', primary: '#7A263A', secondary: '#1BB1E7' },
  { id: 'everton', abbr: 'EVE', primary: '#003399', secondary: '#FFFFFF' },
  { id: 'bayern-munich', abbr: 'FCB', primary: '#DC052D', secondary: '#0066B2' },
  { id: 'borussia-dortmund', abbr: 'BVB', primary: '#FDE100', secondary: '#000000' },
  { id: 'psg', abbr: 'PSG', primary: '#004170', secondary: '#DA020E' },
  { id: 'marseille', abbr: 'OM', primary: '#2FAEE0', secondary: '#FFFFFF' },
  { id: 'juventus', abbr: 'JUV', primary: '#000000', secondary: '#FFFFFF' },
  { id: 'ac-milan', abbr: 'MIL', primary: '#FB090B', secondary: '#000000' },
  { id: 'inter-milan', abbr: 'INT', primary: '#010E80', secondary: '#000000' },
  { id: 'napoli', abbr: 'NAP', primary: '#12A0D7', secondary: '#FFFFFF' },
  { id: 'roma', abbr: 'ROM', primary: '#8E1F2F', secondary: '#F0BC42' },
  { id: 'ajax', abbr: 'AJA', primary: '#D2122E', secondary: '#FFFFFF' },
  { id: 'benfica', abbr: 'BEN', primary: '#E30613', secondary: '#FFFFFF' },
  { id: 'porto', abbr: 'POR', primary: '#003893', secondary: '#FFFFFF' },
  { id: 'celtic', abbr: 'CEL', primary: '#008749', secondary: '#FFFFFF' },
  { id: 'rangers', abbr: 'RAN', primary: '#1B458F', secondary: '#E03131' },
  { id: 'galatasaray', abbr: 'GAL', primary: '#FDB912', secondary: '#A90432' },
  { id: 'fenerbahce', abbr: 'FEN', primary: '#FFED00', secondary: '#002D72' },
  { id: 'boca-juniors', abbr: 'BOC', primary: '#003087', secondary: '#F9D616' },
  { id: 'river-plate', abbr: 'RIV', primary: '#E32020', secondary: '#FFFFFF' },
  { id: 'flamengo', abbr: 'FLA', primary: '#C3281E', secondary: '#000000' },
  { id: 'corinthians', abbr: 'COR', primary: '#000000', secondary: '#FFFFFF' },
  { id: 'inter-miami', abbr: 'MIA', primary: '#F7B5CD', secondary: '#231F20' },
];

function svg({ abbr, primary, secondary }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="60" fill="url(#g)" stroke="#ffffff" stroke-width="4"/>
  <text x="64" y="72" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#ffffff">${abbr}</text>
</svg>`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const club of CLUBS) {
    await writeFile(path.join(OUT_DIR, `${club.id}.svg`), svg(club), 'utf8');
    console.log(`Generated ${club.id}.svg`);
  }
}

main();
