import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDownWideNarrow, History, Split, Users, UsersRound } from 'lucide-react';
import { PlayerCard } from '@/components/PlayerCard';
import { api, ApiError } from '@/lib/api';
import {
  getMatchSizeLabel,
  getPositionsLabel,
  getThreeWayMatchSizeLabel,
  teamSizesFromPlayerCount,
  teamSizesFromThreeWaySplit,
  type Player,
} from '@shared/types';
import { cn } from '@/lib/utils';

function matchNamePlaceholder() {
  const d = new Date();
  return `${d.toLocaleString('en-US', { month: 'long' })} ${d.getDate()} - Suresh`;
}

export function GroupPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [matchName, setMatchName] = useState('');
  const [search, setSearch] = useState('');
  const [sortByRating, setSortByRating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<'two' | 'three' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .getGroup(slug)
      .then((data) => {
        setGroupName(data.name);
        setPlayers(data.players);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load group');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? [...players]
      : players.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.favouriteClub.toLowerCase().includes(q) ||
            getPositionsLabel(p.positions).toLowerCase().includes(q) ||
            p.positions.some((pos) => pos.toLowerCase().includes(q)),
        );

    if (sortByRating) {
      list.sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name));
    }
    return list;
  }, [players, search, sortByRating]);

  const ratingRanks = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name));
    const ranks = new Map<string, number>();
    sorted.forEach((player, index) => {
      ranks.set(player.id, index + 1);
    });
    return ranks;
  }, [players]);

  const selectedCount = selected.size;
  const teamSizes = teamSizesFromPlayerCount(selectedCount);
  const threeWaySizes = teamSizesFromThreeWaySplit(selectedCount);
  const matchLabel = teamSizes ? getMatchSizeLabel(teamSizes.teamASize, teamSizes.teamBSize) : null;
  const threeWayLabel = threeWaySizes
    ? getThreeWayMatchSizeLabel(threeWaySizes[0], threeWaySizes[1], threeWaySizes[2])
    : null;
  const canGenerateTwo = teamSizes !== null && generating === null;
  const canGenerateThree = threeWaySizes !== null && generating === null;

  function togglePlayer(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function handleGenerate(teamCount: 2 | 3) {
    if (teamCount === 2 && !teamSizes) return;
    if (teamCount === 3 && !threeWaySizes) return;

    setGenerating(teamCount === 3 ? 'three' : 'two');
    setError('');
    try {
      const match = await api.generateMatch(
        slug,
        Array.from(selected),
        matchName.trim(),
        teamCount,
      );
      navigate(`/${slug}/match/${match.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate teams');
    } finally {
      setGenerating(null);
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading squad…</p>;
  }

  if (error && !groupName) {
    return (
      <div className="card p-6">
        <p className="text-red-600">{error}</p>
        <Link to="/" className="btn-secondary mt-4 inline-flex">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Squad</p>
          <h1 className="font-display text-3xl font-bold text-slate-900">{groupName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {players.length} in squad · {selectedCount} selected for today
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/${slug}/claim`} className="btn-secondary">
            Claim / rate
          </Link>
          <Link to={`/${slug}/reviews`} className="btn-secondary">
            Who rated whom
          </Link>
          <Link to={`/${slug}/history`} className="btn-secondary">
            <History className="h-4 w-4" /> Match history
          </Link>
        </div>
      </div>

      <section className="card p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="min-w-0 flex-1">
            <label className="label" htmlFor="match-name">
              Match name
            </label>
            <input
              id="match-name"
              className="input"
              placeholder={matchNamePlaceholder()}
              value={matchName}
              onChange={(e) => setMatchName(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Shown when you share the lineup — e.g. &quot;July 7 - Suresh&quot;
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-secondary"
              disabled={selectedCount === 0 || generating !== null}
              onClick={clearSelection}
            >
              Clear selection
            </button>

            <button
              type="button"
              className="btn-primary"
              disabled={!canGenerateTwo}
              onClick={() => handleGenerate(2)}
            >
              <UsersRound className="h-4 w-4" />
              {generating === 'two' ? 'Generating…' : 'Balance teams'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              disabled={!canGenerateThree}
              onClick={() => handleGenerate(3)}
            >
              <Split className="h-4 w-4" />
              {generating === 'three' ? 'Splitting…' : 'Three-way split'}
            </button>
          </div>
        </div>

        {selectedCount === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            Tick who is coming. Two teams: 9–22 players (11 → 6v5, 12 → 6v6). Three teams: 12–22
            players (15 → 5v5v5, 21 → 7v7v7).
          </p>
        ) : null}

        {selectedCount > 0 && !teamSizes && !threeWaySizes ? (
          <p className="mt-3 text-sm text-amber-700">
            {selectedCount} selected — need at least 9 for two teams or 12 for three teams.
          </p>
        ) : null}

        {canGenerateTwo && teamSizes && matchLabel ? (
          <p className="mt-3 text-sm text-emerald-700">
            Two teams — {selectedCount} players → {matchLabel}.
          </p>
        ) : null}

        {canGenerateThree && threeWaySizes && threeWayLabel ? (
          <p className="mt-3 text-sm text-emerald-700">
            Three teams — {selectedCount} players → {threeWayLabel}.
          </p>
        ) : null}

        {selectedCount >= 9 && selectedCount < 12 ? (
          <p className="mt-2 text-sm text-slate-500">
            Three-way split unlocks at 12+ players. Use Balance teams for now.
          </p>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="inline-flex items-center gap-2 font-display text-xl font-bold">
              <Users className="h-5 w-5 text-elite-500" /> Today&apos;s availability
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Tap the checkbox for each player who is coming or will show up — manual only, no
              random picks.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={cn(
                'btn-secondary',
                sortByRating && 'border-elite-300 bg-elite-50 text-elite-800',
              )}
              aria-pressed={sortByRating}
              onClick={() => setSortByRating((v) => !v)}
            >
              <ArrowDownWideNarrow className="h-4 w-4" />
              Sort by rating
            </button>
            <input
              className="input max-w-xs"
              placeholder="Search players…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">No players found.</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {filtered.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                selectable
                selected={selected.has(player.id)}
                onToggle={() => togglePlayer(player.id)}
                ratingRank={sortByRating ? ratingRanks.get(player.id) : undefined}
                ratingTotal={sortByRating ? players.length : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
