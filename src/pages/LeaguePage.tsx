import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { User } from 'lucide-react';
import { GroupPageHeading } from '@/components/GroupPageHeading';
import { api, ApiError } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import type { LeaguePlayerRow, LeagueScope, LeagueSeason } from '@shared/league';

type LeagueTab = 'attendance' | 'goals' | 'matches';
type VisibleScope = Exclude<LeagueScope, 'all'>;

const SCOPES: Array<{ id: VisibleScope; label: string; hint: string }> = [
  { id: 'internal', label: 'Internal', hint: 'Squad nights. Attendance only — scores do not count.' },
  { id: 'external', label: 'External', hint: 'Vs another side. Attendance, goals, and W–D–L count.' },
];

const TABS: Array<{ id: LeagueTab; label: string }> = [
  { id: 'attendance', label: 'Attendance' },
  { id: 'goals', label: 'Goals scored' },
  { id: 'matches', label: 'Matches' },
];

function scopeTone(scope: VisibleScope, selected: boolean) {
  if (!selected) return 'text-slate-500 hover:text-slate-800';
  return scope === 'external'
    ? 'bg-sky-600 text-white shadow-sm'
    : 'bg-emerald-600 text-white shadow-sm';
}

function tabTone(scope: VisibleScope, selected: boolean) {
  if (!selected) return 'font-medium text-slate-500 hover:text-slate-800';
  return scope === 'external'
    ? 'bg-sky-50 font-bold text-sky-800 ring-1 ring-sky-200'
    : 'bg-emerald-50 font-bold text-emerald-800 ring-1 ring-emerald-200';
}

function sortPlayers(players: LeaguePlayerRow[], tab: LeagueTab): LeaguePlayerRow[] {
  return [...players].sort((a, b) => {
    if (tab === 'goals') {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
    } else {
      if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
      if (b.goals !== a.goals) return b.goals - a.goals;
    }
    return a.playerName.localeCompare(b.playerName, undefined, { sensitivity: 'base' });
  });
}

function goalsPerGame(player: LeaguePlayerRow): string {
  if (player.gamesPlayed <= 0) return player.goals > 0 ? String(player.goals) : '—';
  return (player.goals / player.gamesPlayed).toFixed(2);
}

export function LeaguePage() {
  const { slug = '' } = useParams();
  const [groupName, setGroupName] = useState('');
  const [seasons, setSeasons] = useState<LeagueSeason[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [scope, setScope] = useState<VisibleScope>('internal');
  const [tab, setTab] = useState<LeagueTab>('attendance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .getLeague(slug)
      .then((data) => {
        setGroupName(data.group.name);
        setSeasons(data.seasons);
        const current = new Date().getFullYear();
        setYear(data.seasons.some((season) => season.year === current) ? current : data.seasons[0]?.year ?? current);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load league status');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const season = useMemo(
    () => seasons.find((row) => row.year === year) ?? seasons[0],
    [seasons, year],
  );
  const view = season?.[scope];
  const scopeHint = SCOPES.find((item) => item.id === scope)?.hint ?? '';
  const players = useMemo(() => {
    if (!view) return [];
    const filtered =
      tab === 'goals'
        ? view.players.filter((player) => player.goals > 0)
        : view.players.filter((player) => player.gamesPlayed > 0);
    return sortPlayers(filtered, tab);
  }, [view, tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <GroupPageHeading slug={slug} groupName={groupName} title="League status">
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Calendar year totals. Internal is attendance. External is vs another side — scores
            count there.
          </p>
        </GroupPageHeading>
        <div className="flex flex-wrap gap-2">
          <Link to={`/${slug}/games-played`} className="btn-secondary">
            Games played
          </Link>
          <Link to={`/${slug}/history`} className="btn-secondary">
            Match history
          </Link>
          <Link to={`/${slug}`} className="btn-secondary">
            Squad
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !season ? (
        <div className="card p-5 text-sm text-slate-600">No league data yet.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {seasons.map((row) => (
              <button
                key={row.year}
                type="button"
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition',
                  year === row.year
                    ? 'bg-elite-600 text-white ring-elite-600'
                    : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50',
                )}
                onClick={() => setYear(row.year)}
              >
                {row.year}
              </button>
            ))}
          </div>

          <div>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {SCOPES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    'flex-1 rounded-lg px-3 py-2 text-sm font-bold transition',
                    scopeTone(item.id, scope === item.id),
                  )}
                  onClick={() => {
                    setScope(item.id);
                    if (item.id === 'internal' && tab === 'goals') setTab('attendance');
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-500">{scopeHint}</p>
          </div>

          {view ? (
          <section
            className={cn(
              'grid gap-3',
              scope === 'external' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2',
            )}
          >
            {(scope === 'external'
              ? [
                  { label: 'Matches', value: view.matchesPlayed },
                  { label: 'Goals scored', value: view.goalsFor },
                  { label: 'Goals conceded', value: view.goalsAgainst },
                  {
                    label: 'W–D–L',
                    value: `${view.wins}–${view.draws}–${view.losses}`,
                  },
                ]
              : [{ label: 'Matches', value: view.matchesPlayed }]
            ).map((card) => (
              <div key={card.label} className="card px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {card.label}
                </p>
                <p className="mt-1 font-display text-2xl font-bold tabular-nums text-slate-900">
                  {card.value}
                </p>
              </div>
            ))}
          </section>
          ) : null}

          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {TABS.filter((item) => scope === 'external' || item.id !== 'goals').map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'flex-1 rounded-lg px-3 py-2 text-sm transition',
                  tabTone(scope, tab === item.id),
                )}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'matches' ? (
            !view || view.matches.length === 0 ? (
              <div className="card p-5 text-sm text-slate-600">
                {scope === 'internal'
                  ? `No internal matches in ${season.year}.`
                  : `No external matches in ${season.year}.`}
              </div>
            ) : (
              <div className="space-y-2">
                {view.matches.map((match) => (
                  <Link
                    key={match.id}
                    to={`/${slug}/match/${match.id}`}
                    className="card flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-elite-50/60"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {match.name.trim() || `${match.format}-a-side`}
                        {match.recorded ? (
                          <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                            Played
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-slate-500">
                        {match.score ? (
                          <span className="mr-2 font-semibold text-slate-700">{match.score}</span>
                        ) : null}
                        {match.playerCount} players
                        {match.date ? ` · ${formatDate(match.date)}` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-elite-600">View</span>
                  </Link>
                ))}
              </div>
            )
          ) : players.length === 0 ? (
            <div className="card p-5 text-sm text-slate-600">
              {tab === 'goals'
                ? `No external goals recorded in ${season.year}.`
                : `No attendance recorded in ${season.year}. Mark a match as played to start the table.`}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">Player</th>
                    <th className="px-3 py-2 font-semibold">
                      {tab === 'goals' ? 'Goals' : 'Games'}
                    </th>
                    {tab === 'goals' || scope === 'external' ? (
                      <th className="px-3 py-2 font-semibold">
                        {tab === 'goals' ? 'Games' : 'Goals'}
                      </th>
                    ) : null}
                    {tab === 'goals' ? (
                      <th className="px-3 py-2 font-semibold">G/G</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, index) => (
                    <tr key={player.playerId} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2 tabular-nums text-slate-400">{index + 1}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-elite-50 ring-1 ring-slate-200">
                            {player.photoUrl ? (
                              <img
                                src={player.photoUrl}
                                alt=""
                                className="h-full w-full object-cover object-top"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <User className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-slate-900">{player.playerName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-display text-base font-bold tabular-nums text-elite-700">
                        {tab === 'goals' ? player.goals : player.gamesPlayed}
                      </td>
                      {tab === 'goals' || scope === 'external' ? (
                      <td className="px-3 py-2 tabular-nums text-slate-700">
                        {tab === 'goals' ? player.gamesPlayed : player.goals}
                      </td>
                      ) : null}
                      {tab === 'goals' ? (
                        <td className="px-3 py-2 tabular-nums text-slate-500">
                          {goalsPerGame(player)}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
