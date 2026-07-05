import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { History, Users, UsersRound } from 'lucide-react';
import { PlayerCard } from '@/components/PlayerCard';
import { api, ApiError } from '@/lib/api';
import {
  getMatchSizeLabel,
  getPositionsLabel,
  teamSizesFromPlayerCount,
  type Player,
} from '@shared/types';

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
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
    if (!q) return players;
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.favouriteClub.toLowerCase().includes(q) ||
        getPositionsLabel(p.positions).toLowerCase().includes(q) ||
        p.positions.some((pos) => pos.toLowerCase().includes(q)),
    );
  }, [players, search]);

  const selectedCount = selected.size;
  const teamSizes = teamSizesFromPlayerCount(selectedCount);
  const matchLabel = teamSizes ? getMatchSizeLabel(teamSizes.teamASize, teamSizes.teamBSize) : null;
  const canGenerate = teamSizes !== null && !generating;

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

  async function handleGenerate() {
    if (!teamSizes) return;
    setGenerating(true);
    setError('');
    try {
      const match = await api.generateMatch(slug, Array.from(selected), matchName.trim());
      navigate(`/${slug}/match/${match.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to generate teams');
    } finally {
      setGenerating(false);
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
        <Link to={`/${slug}/history`} className="btn-secondary">
          <History className="h-4 w-4" /> Match history
        </Link>
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
              disabled={selectedCount === 0}
              onClick={clearSelection}
            >
              Clear selection
            </button>

            <button
              type="button"
              className="btn-primary"
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              <UsersRound className="h-4 w-4" />
              {generating ? 'Generating…' : 'Balance teams'}
            </button>
          </div>
        </div>

        {selectedCount === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            Tick who is playing today (9–22 players). Size is automatic — 11 selected → 6v5, 12 →
            6v6, 10 → 5v5.
          </p>
        ) : null}

        {selectedCount > 0 && !teamSizes ? (
          <p className="mt-3 text-sm text-amber-700">
            {selectedCount} selected — need 9–22 players for a match.
          </p>
        ) : null}

        {canGenerate && teamSizes && matchLabel ? (
          <p className="mt-3 text-sm text-emerald-700">
            Ready — {selectedCount} players → {matchLabel}. Teams balanced from your selection.
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
              Tap the checkbox to select who showed up — manual only, no random picks.
            </p>
          </div>
          <input
            className="input max-w-xs"
            placeholder="Search players…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
