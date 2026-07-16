import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Upload } from 'lucide-react';
import { ClubSelect } from '@/components/ClubSelect';
import { PlayerCard } from '@/components/PlayerCard';
import { api, ApiError } from '@/lib/api';
import { getClubById, resolveClubId } from '@shared/clubs';
import { calculateOvr, getPositionsLabel, MAX_PLAYER_POSITIONS, PLAYER_POSITIONS, roundRating, STAT_KEYS, type Player, type PlayerPosition, type PlayerStats } from '@shared/types';
import { cn } from '@/lib/utils';
import { fileToBase64, getAdminToken } from '@/lib/utils';

const emptyStats = (): PlayerStats => ({
  pace: 50,
  shooting: 50,
  passing: 50,
  dribbling: 50,
  defending: 50,
  physicality: 50,
  stamina: 50,
});

export function AdminGroupPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Player | null>(null);
  const [form, setForm] = useState({
    name: '',
    positions: ['MID'] as PlayerPosition[],
    clubId: '',
    photoUrl: '',
    stats: emptyStats(),
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const previewOvr = useMemo(() => calculateOvr(form.stats), [form.stats]);

  useEffect(() => {
    if (!getAdminToken()) {
      navigate('/admin');
      return;
    }

    api
      .adminGetGroup(slug)
      .then((data) => {
        setGroupName(data.name);
        setPlayers(data.players);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load group');
      })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

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

  function resetForm() {
    setEditing(null);
    setForm({
      name: '',
      positions: ['MID'],
      clubId: '',
      photoUrl: '',
      stats: emptyStats(),
    });
    setPhotoFile(null);
  }

  function startEdit(player: Player) {
    setEditing(player);
    setForm({
      name: player.name,
      positions: player.positions.length ? [...player.positions] : ['MID'],
      clubId: resolveClubId(player.favouriteClub, player.clubLogoUrl),
      photoUrl: player.photoUrl ?? '',
      stats: {
        pace: player.pace,
        shooting: player.shooting,
        passing: player.passing,
        dribbling: player.dribbling,
        defending: player.defending,
        physicality: player.physicality,
        stamina: player.stamina,
      },
    });
    setPhotoFile(null);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (form.positions.length === 0) {
      setError('Select at least one position');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let player: Player;
      const club = getClubById(form.clubId);
      const payload: Record<string, unknown> = {
        name: form.name,
        positions: form.positions,
        favouriteClub: club?.name ?? '',
        clubLogoUrl: club?.logo ?? null,
        photoUrl: form.photoUrl || null,
        stats: form.stats,
      };

      if (photoFile) {
        payload.imageBase64 = await fileToBase64(photoFile);
        payload.mimeType = photoFile.type;
      }

      if (editing) {
        player = await api.adminUpdatePlayer(slug, { ...payload, id: editing.id });
      } else {
        player = await api.adminCreatePlayer(slug, payload);
      }

      setPlayers((prev) => {
        const exists = prev.some((p) => p.id === player.id);
        return exists
          ? prev.map((p) => (p.id === player.id ? player : p))
          : [...prev, player];
      });
      resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save player');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this player?')) return;
    try {
      await api.adminDeletePlayer(slug, id);
      setPlayers((prev) => prev.filter((p) => p.id !== id));
      if (editing?.id === id) resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete player');
    }
  }

  function togglePosition(position: PlayerPosition) {
    setForm((current) => {
      const selected = current.positions.includes(position);
      if (selected) {
        const next = current.positions.filter((p) => p !== position);
        return { ...current, positions: next.length ? next : current.positions };
      }
      if (current.positions.length >= MAX_PLAYER_POSITIONS) return current;
      return { ...current, positions: [...current.positions, position] };
    });
  }

  function setStat(key: keyof PlayerStats, raw: number) {
    const value = Math.min(100, Math.max(0, Math.round(Number.isNaN(raw) ? 0 : raw)));
    setForm((f) => ({
      ...f,
      stats: { ...f.stats, [key]: value },
    }));
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/admin/dashboard"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-elite-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold text-slate-900">{groupName}</h1>
          <p className="text-sm text-slate-500">/{slug}</p>
        </div>
        <Link to={`/${slug}`} className="btn-secondary">
          View public page
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-slate-900">Players</h2>
            <input
              className="input max-w-xs"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            {filtered.map((player) => (
              <div key={player.id} className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 text-left"
                  onClick={() => startEdit(player)}
                >
                  <PlayerCard player={player} />
                </button>
                <button
                  type="button"
                  className="btn-secondary px-3"
                  onClick={() => handleDelete(player.id)}
                  aria-label={`Delete ${player.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-display text-xl font-bold text-slate-900">
            {editing ? 'Edit player' : 'Add player'}
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="label mb-0">Positions</label>
                <span className="text-xs text-slate-500">
                  {form.positions.length}/{MAX_PLAYER_POSITIONS} selected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PLAYER_POSITIONS.map((pos) => {
                  const selected = form.positions.includes(pos.value);
                  const disabled =
                    !selected && form.positions.length >= MAX_PLAYER_POSITIONS;
                  return (
                    <button
                      key={pos.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => togglePosition(pos.value)}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-left text-sm transition',
                        selected
                          ? 'border-elite-400 bg-elite-50 text-elite-800 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-elite-200',
                        disabled && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      <span className="font-semibold">{pos.short}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{pos.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Pick 1–2 positions.</p>
            </div>

            <div>
              <label className="label" htmlFor="favourite-club">
                Favourite club
              </label>
              <ClubSelect
                value={form.clubId}
                onChange={(clubId) => setForm((f) => ({ ...f, clubId }))}
              />
            </div>

            <div>
              <label className="label">Photo</label>
              <label className="btn-secondary cursor-pointer">
                <Upload className="h-4 w-4" /> Choose image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {photoFile ? (
                <p className="mt-1 text-xs text-slate-500">{photoFile.name}</p>
              ) : form.photoUrl ? (
                <img
                  src={form.photoUrl}
                  alt="Preview"
                  className="mt-2 h-16 w-16 rounded-xl object-cover"
                />
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="label mb-0">Attributes</p>
                <p className="text-sm font-display font-bold text-elite-600">
                  OVR {roundRating(previewOvr)}
                </p>
              </div>
              {STAT_KEYS.map((key) => (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs capitalize text-slate-500">{key}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={form.stats[key]}
                      onChange={(e) => setStat(key, Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs font-semibold text-slate-900 outline-none focus:border-elite-300 focus:ring-2 focus:ring-elite-500/30"
                      aria-label={`${key} rating`}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.stats[key]}
                    onChange={(e) => setStat(key, Number(e.target.value))}
                    className="w-full accent-elite-600"
                    aria-label={`${key} slider`}
                  />
                </div>
              ))}
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save player'}
              </button>
              {editing ? (
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
