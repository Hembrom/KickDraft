import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { History, Shuffle, Users } from 'lucide-react';
import { PitchView } from '@/components/PitchView';
import { PlayerCard } from '@/components/PlayerCard';
import { api, ApiError } from '@/lib/api';
import { MATCH_FORMATS, getPositionsLabel, suggestFormat, type MatchRecord, type Player } from '@shared/types';

export function GroupPage() {
  const { slug = '' } = useParams();
  const [groupName, setGroupName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<number | 'auto'>('auto');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<MatchRecord | null>(null);

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
  const autoFormat = suggestFormat(selectedCount);
  const resolvedFormat = format === 'auto' ? autoFormat : format;
  const canGenerate =
    resolvedFormat !== null &&
    selectedCount === resolvedFormat * 2 &&
    !generating;

  function togglePlayer(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    if (!resolvedFormat) return;
    setGenerating(true);
    setError('');
    try {
      const match = await api.generateMatch(slug, Array.from(selected), resolvedFormat);
      setResult(match);
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
            {players.length} players · {selectedCount} selected
          </p>
        </div>
        <Link to={`/${slug}/history`} className="btn-secondary">
          <History className="h-4 w-4" /> Match history
        </Link>
      </div>

      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px] flex-1">
            <label className="label">Match format</label>
            <select
              className="input"
              value={format === 'auto' ? 'auto' : String(format)}
              onChange={(e) => {
                const value = e.target.value;
                setFormat(value === 'auto' ? 'auto' : Number(value));
              }}
            >
              <option value="auto">
                Auto {autoFormat ? `(suggests ${autoFormat}v${autoFormat})` : '(need even count)'}
              </option>
              {MATCH_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}v{f} ({f * 2} players)
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn-primary"
            disabled={!canGenerate}
            onClick={handleGenerate}
          >
            <Shuffle className="h-4 w-4" />
            {generating ? 'Generating…' : 'Generate teams'}
          </button>
        </div>

        {selectedCount > 0 && resolvedFormat === null ? (
          <p className="mt-3 text-sm text-amber-700">
            {selectedCount} players selected — pick an even number for equal teams, or choose a
            manual format.
          </p>
        ) : null}

        {selectedCount > 0 && resolvedFormat !== null && selectedCount !== resolvedFormat * 2 ? (
          <p className="mt-3 text-sm text-amber-700">
            Select exactly {resolvedFormat * 2} players for {resolvedFormat}v{resolvedFormat}.
          </p>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      {result ? (
        <section className="space-y-4">
          <div className="flex justify-end">
            <button type="button" className="btn-secondary" onClick={() => setResult(null)}>
              Clear result
            </button>
          </div>
          <PitchView match={result} roster={players} />
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 font-display text-xl font-bold">
            <Users className="h-5 w-5 text-elite-500" /> Today&apos;s availability
          </h2>
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
