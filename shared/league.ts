import {
  formatMatchScore,
  goalsAgainst,
  goalsFor,
  matchPlayers,
  totalGoals,
} from './match-result.js';
import {
  isExternalMatch,
  isRotationMatch,
  type MatchRecord,
  type Player,
  type PlayerAppearance,
} from './types.js';

export function matchCalendarYear(iso: string): number {
  const year = new Date(iso).getFullYear();
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

export function isLeagueMatch(match: {
  recordedAsPlayed?: boolean;
  external?: boolean;
  result?: MatchRecord['result'];
  teamA?: unknown;
}): boolean {
  if (match.recordedAsPlayed) return true;
  if (match.external) return true;
  if (match.result) return true;
  const extras = match.teamA as { externalMatch?: boolean; matchResult?: unknown } | undefined;
  return extras?.externalMatch === true || Boolean(extras?.matchResult);
}

export interface LeaguePlayerRow {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  gamesPlayed: number;
  goals: number;
}

export interface LeagueMatchRow {
  id: string;
  name: string;
  date: string;
  format: number;
  score: string | null;
  external: boolean;
  recorded: boolean;
  playerCount: number;
  goalsFor: number;
  goalsAgainst: number;
  rotation: boolean;
}

export type LeagueScope = 'all' | 'internal' | 'external';

export interface LeagueSeasonView {
  matchesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  wins: number;
  draws: number;
  losses: number;
  players: LeaguePlayerRow[];
  matches: LeagueMatchRow[];
}

export interface LeagueSeason {
  year: number;
  all: LeagueSeasonView;
  internal: LeagueSeasonView;
  external: LeagueSeasonView;
}

function emptyPlayer(
  playerId: string,
  playerName: string,
  photoUrl: string | null,
): LeaguePlayerRow {
  return { playerId, playerName, photoUrl, gamesPlayed: 0, goals: 0 };
}

function comparePlayers(a: LeaguePlayerRow, b: LeaguePlayerRow): number {
  if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
  if (b.goals !== a.goals) return b.goals - a.goals;
  return a.playerName.localeCompare(b.playerName, undefined, { sensitivity: 'base' });
}

function summarizeView(
  matches: LeagueMatchRow[],
  players: LeaguePlayerRow[],
  matchFilter: (match: LeagueMatchRow) => boolean,
): LeagueSeasonView {
  const list = matches.filter(matchFilter);
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsForTotal = 0;
  let goalsAgainstTotal = 0;
  for (const match of list) {
    goalsForTotal += match.goalsFor;
    goalsAgainstTotal += match.goalsAgainst;
    if (match.score && match.rotation) {
      if (match.goalsFor > match.goalsAgainst) wins += 1;
      else if (match.goalsFor < match.goalsAgainst) losses += 1;
      else draws += 1;
    }
  }
  return {
    matchesPlayed: list.length,
    goalsFor: goalsForTotal,
    goalsAgainst: goalsAgainstTotal,
    wins,
    draws,
    losses,
    players: players
      .filter((player) => player.gamesPlayed > 0 || player.goals > 0)
      .sort(comparePlayers),
    matches: list,
  };
}

export function buildLeagueSeasons(
  matches: MatchRecord[],
  appearances: PlayerAppearance[],
  roster: Player[],
): LeagueSeason[] {
  const rosterById = new Map(roster.map((player) => [player.id, player]));
  const years = new Set<number>();
  const playersByYear = new Map<number, Map<LeagueScope, Map<string, LeaguePlayerRow>>>();
  const matchRowsByYear = new Map<number, Map<string, LeagueMatchRow>>();
  const rosterCounted = new Set<string>();

  function playersFor(year: number, scope: LeagueScope): Map<string, LeaguePlayerRow> {
    let yearMap = playersByYear.get(year);
    if (!yearMap) {
      yearMap = new Map();
      playersByYear.set(year, yearMap);
    }
    let map = yearMap.get(scope);
    if (!map) {
      map = new Map();
      yearMap.set(scope, map);
    }
    return map;
  }

  function playerRow(
    year: number,
    scope: LeagueScope,
    playerId: string,
    playerName: string,
    photoUrl: string | null,
  ): LeaguePlayerRow {
    const map = playersFor(year, scope);
    const existing = map.get(playerId);
    if (existing) {
      if (!existing.photoUrl && photoUrl) existing.photoUrl = photoUrl;
      if (playerName && existing.playerName !== playerName) existing.playerName = playerName;
      return existing;
    }
    const rosterPlayer = rosterById.get(playerId);
    const row = emptyPlayer(
      playerId,
      rosterPlayer?.name || playerName,
      rosterPlayer?.photoUrl ?? photoUrl,
    );
    map.set(playerId, row);
    return row;
  }

  function matchRow(year: number, id: string): LeagueMatchRow {
    let yearMap = matchRowsByYear.get(year);
    if (!yearMap) {
      yearMap = new Map();
      matchRowsByYear.set(year, yearMap);
    }
    const existing = yearMap.get(id);
    if (existing) return existing;
    const row: LeagueMatchRow = {
      id,
      name: '',
      date: '',
      format: 0,
      score: null,
      external: false,
      recorded: false,
      playerCount: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      rotation: false,
    };
    yearMap.set(id, row);
    return row;
  }

  for (const match of matches) {
    if (!isLeagueMatch(match)) continue;
    const year = matchCalendarYear(match.date);
    years.add(year);
    const row = matchRow(year, match.id);
    row.name = (match.name ?? '').trim() || row.name;
    row.date = match.date || row.date;
    row.format = match.format || row.format;
    row.external = isExternalMatch(match);
    row.recorded = row.recorded || Boolean(match.recordedAsPlayed);
    row.rotation = isRotationMatch(match);
    row.playerCount = Math.max(row.playerCount, matchPlayers(match).length);
    rosterCounted.add(match.id);
    if (isExternalMatch(match) && match.result) {
      row.score = formatMatchScore(match);
      row.goalsFor = isRotationMatch(match) ? goalsFor(match) : totalGoals(match);
      row.goalsAgainst = isRotationMatch(match) ? goalsAgainst(match) : 0;
    }
  }

  for (const appearance of appearances) {
    const year = matchCalendarYear(appearance.matchDate);
    years.add(year);
    const row = matchRow(year, appearance.matchId);
    row.recorded = true;
    if (!rosterCounted.has(appearance.matchId)) row.playerCount += 1;
    if (!row.name) row.name = appearance.matchName;
    if (!row.date) row.date = appearance.matchDate;
    if (!row.format) row.format = appearance.format;
    const scope: LeagueScope = row.external ? 'external' : 'internal';
    playerRow(year, 'all', appearance.playerId, appearance.playerName, null).gamesPlayed += 1;
    playerRow(year, scope, appearance.playerId, appearance.playerName, null).gamesPlayed += 1;
  }

  for (const match of matches) {
    if (!isExternalMatch(match) || !match.result) continue;
    const year = matchCalendarYear(match.date);
    for (const player of matchPlayers(match)) {
      const goals = match.result.scorers[player.id] ?? 0;
      if (goals <= 0) continue;
      playerRow(year, 'all', player.id, player.name, player.photoUrl).goals += goals;
      playerRow(year, 'external', player.id, player.name, player.photoUrl).goals += goals;
    }
  }

  if (years.size === 0) {
    years.add(new Date().getFullYear());
  }

  return [...years]
    .sort((a, b) => b - a)
    .map((year) => {
      const matchList = [...(matchRowsByYear.get(year)?.values() ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      const scoped = playersByYear.get(year);
      const players = (scope: LeagueScope) => [...(scoped?.get(scope)?.values() ?? [])];

      return {
        year,
        all: summarizeView(matchList, players('all'), () => true),
        internal: summarizeView(matchList, players('internal'), (match) => !match.external),
        external: summarizeView(matchList, players('external'), (match) => match.external),
      };
    });
}
