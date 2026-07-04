export interface FootballClub {
  id: string;
  name: string;
  league: string;
  logo: string;
}

export const FOOTBALL_CLUBS: FootballClub[] = [
  { id: 'real-madrid', name: 'Real Madrid', league: 'La Liga', logo: '/clubs/real-madrid.svg' },
  { id: 'barcelona', name: 'Barcelona', league: 'La Liga', logo: '/clubs/barcelona.svg' },
  { id: 'atletico-madrid', name: 'Atlético Madrid', league: 'La Liga', logo: '/clubs/atletico-madrid.png' },
  { id: 'sevilla', name: 'Sevilla', league: 'La Liga', logo: '/clubs/sevilla.svg' },
  { id: 'manchester-united', name: 'Manchester United', league: 'Premier League', logo: '/clubs/manchester-united.svg' },
  { id: 'manchester-city', name: 'Manchester City', league: 'Premier League', logo: '/clubs/manchester-city.svg' },
  { id: 'liverpool', name: 'Liverpool', league: 'Premier League', logo: '/clubs/liverpool.svg' },
  { id: 'chelsea', name: 'Chelsea', league: 'Premier League', logo: '/clubs/chelsea.svg' },
  { id: 'arsenal', name: 'Arsenal', league: 'Premier League', logo: '/clubs/arsenal.svg' },
  { id: 'tottenham', name: 'Tottenham Hotspur', league: 'Premier League', logo: '/clubs/tottenham.svg' },
  { id: 'newcastle', name: 'Newcastle United', league: 'Premier League', logo: '/clubs/newcastle.svg' },
  { id: 'aston-villa', name: 'Aston Villa', league: 'Premier League', logo: '/clubs/aston-villa.svg' },
  { id: 'west-ham', name: 'West Ham United', league: 'Premier League', logo: '/clubs/west-ham.svg' },
  { id: 'everton', name: 'Everton', league: 'Premier League', logo: '/clubs/everton.svg' },
  { id: 'bayern-munich', name: 'Bayern Munich', league: 'Bundesliga', logo: '/clubs/bayern-munich.svg' },
  { id: 'borussia-dortmund', name: 'Borussia Dortmund', league: 'Bundesliga', logo: '/clubs/borussia-dortmund.svg' },
  { id: 'psg', name: 'Paris Saint-Germain', league: 'Ligue 1', logo: '/clubs/psg.svg' },
  { id: 'marseille', name: 'Olympique Marseille', league: 'Ligue 1', logo: '/clubs/marseille.svg' },
  { id: 'juventus', name: 'Juventus', league: 'Serie A', logo: '/clubs/juventus.png' },
  { id: 'ac-milan', name: 'AC Milan', league: 'Serie A', logo: '/clubs/ac-milan.svg' },
  { id: 'inter-milan', name: 'Inter Milan', league: 'Serie A', logo: '/clubs/inter-milan.svg' },
  { id: 'napoli', name: 'Napoli', league: 'Serie A', logo: '/clubs/napoli.svg' },
  { id: 'roma', name: 'AS Roma', league: 'Serie A', logo: '/clubs/roma.svg' },
  { id: 'ajax', name: 'Ajax', league: 'Eredivisie', logo: '/clubs/ajax.svg' },
  { id: 'benfica', name: 'Benfica', league: 'Primeira Liga', logo: '/clubs/benfica.svg' },
  { id: 'porto', name: 'FC Porto', league: 'Primeira Liga', logo: '/clubs/porto.svg' },
  { id: 'celtic', name: 'Celtic', league: 'Scottish Premiership', logo: '/clubs/celtic.svg' },
  { id: 'rangers', name: 'Rangers', league: 'Scottish Premiership', logo: '/clubs/rangers.svg' },
  { id: 'galatasaray', name: 'Galatasaray', league: 'Süper Lig', logo: '/clubs/galatasaray.png' },
  { id: 'fenerbahce', name: 'Fenerbahçe', league: 'Süper Lig', logo: '/clubs/fenerbahce.png' },
  { id: 'boca-juniors', name: 'Boca Juniors', league: 'Argentina', logo: '/clubs/boca-juniors.png' },
  { id: 'river-plate', name: 'River Plate', league: 'Argentina', logo: '/clubs/river-plate.png' },
  { id: 'flamengo', name: 'Flamengo', league: 'Brazil', logo: '/clubs/flamengo.png' },
  { id: 'corinthians', name: 'Corinthians', league: 'Brazil', logo: '/clubs/corinthians.png' },
  { id: 'inter-miami', name: 'Inter Miami', league: 'MLS', logo: '/clubs/inter-miami.png' },
];

export function getClubById(id: string): FootballClub | undefined {
  return FOOTBALL_CLUBS.find((club) => club.id === id);
}

export function getClubByName(name: string): FootballClub | undefined {
  const normalized = name.trim().toLowerCase();
  return FOOTBALL_CLUBS.find((club) => club.name.toLowerCase() === normalized);
}

export function resolveClubId(name: string, logoUrl: string | null | undefined): string {
  const byName = getClubByName(name);
  if (byName) return byName.id;
  if (logoUrl) {
    const byLogo = FOOTBALL_CLUBS.find((club) => club.logo === logoUrl);
    if (byLogo) return byLogo.id;
  }
  return '';
}
