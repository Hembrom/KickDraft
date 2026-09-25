import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Loader2, Pencil, Plus, Save, Share2, Shuffle, User, X } from 'lucide-react';
import { MatchResultPanel } from '@/components/MatchResultPanel';
import { RotationLineupBoard } from '@/components/RotationLineupBoard';
import { RotationShapePicker } from '@/components/RotationShapePicker';
import { api, ApiError } from '@/lib/api';
import { shareMatchLineup } from '@/lib/share-match';
import { formatDate } from '@/lib/utils';
import { enrichMatchWithRoster } from '@shared/match-utils';
import {
  ROTATION_SLOTS,
  emptyRotationBoxes,
  formationLabel,
  isRotationFormat,
  parseRotationFormation,
  preferredRotationSlot,
  rotationBoxesToIds,
} from '@shared/rotation-lineup';
import { formatMatchScore } from '@shared/match-result';
import {
  getMatchLabel,
  type MatchRecord,
  type Player,
  type RotationBoxes,
  type RotationSlot,
} from '@shared/types';

function cloneBoxes(boxes: RotationBoxes): RotationBoxes {
  return {
    GK: [...boxes.GK],
    DEF: [...boxes.DEF],
    MID: [...boxes.MID],
    FWD: [...boxes.FWD],
  };
}

function takePlayer(
  slots: Array<Player | null>,
  boxes: RotationBoxes,
  playerId: string,
): {
  player: Player;
  nextSlots: Array<Player | null>;
  nextBoxes: RotationBoxes;
  from: { type: 'pitch'; index: number } | { type: 'bench'; slot: RotationSlot };
} | null {
  const nextSlots = [...slots];
  const nextBoxes = cloneBoxes(boxes);

  const pitchIndex = nextSlots.findIndex((player) => player?.id === playerId);
  if (pitchIndex >= 0) {
    const player = nextSlots[pitchIndex];
    if (!player) return null;
    nextSlots[pitchIndex] = null;
    return { player, nextSlots, nextBoxes, from: { type: 'pitch', index: pitchIndex } };
  }

  for (const slot of ROTATION_SLOTS) {
    const index = nextBoxes[slot].findIndex((player) => player.id === playerId);
    if (index >= 0) {
      const [player] = nextBoxes[slot].splice(index, 1);
      return { player, nextSlots, nextBoxes, from: { type: 'bench', slot } };
    }
  }

  return null;
}

export function RotationMatchView({
  slug,
  groupName,
  match,
  roster,
  isAdmin = false,
  onMatchChange,
}: {
  slug: string;
  groupName: string;
  match: MatchRecord;
  roster: Player[];
  isAdmin?: boolean;
  onMatchChange: (match: MatchRecord) => void;
}) {
  const navigate = useNavigate();
  const display = roster.length > 0 ? enrichMatchWithRoster(match, roster) : match;
  const format = isRotationFormat(match.format) ? match.format : 5;
  const savedShape = useMemo(
    () => parseRotationFormation(display.formation, format),
    [display.formation, format],
  );
  const captureRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<number>(0);

  const initialSlots = useMemo(() => {
    const starters = [...display.teamA.players];
    const slots: Array<Player | null> = starters.slice(0, format);
    while (slots.length < format) slots.push(null);
    return slots;
  }, [display.teamA.players, format]);

  const initialBoxes = useMemo(
    () => display.rotation ?? emptyRotationBoxes(),
    [display.rotation],
  );

  const [slots, setSlots] = useState<Array<Player | null>>(initialSlots);
  const [boxes, setBoxes] = useState<RotationBoxes>(initialBoxes);
  const [shape, setShape] = useState<number[]>(savedShape);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');

  const dirty = useMemo(() => {
    if (formationLabel(shape) !== formationLabel(savedShape)) return true;
    const startIds = slots.map((player) => player?.id ?? '').join(',');
    const savedStart = initialSlots.map((player) => player?.id ?? '').join(',');
    if (startIds !== savedStart) return true;
    return ROTATION_SLOTS.some(
      (slot) =>
        boxes[slot].map((player) => player.id).join(',') !==
        initialBoxes[slot].map((player) => player.id).join(','),
    );
  }, [slots, boxes, initialSlots, initialBoxes, shape, savedShape]);

  function applyShape(nextShape: number[]) {
    const parsed = parseRotationFormation(nextShape, format);
    if (formationLabel(parsed) === formationLabel(shape)) return;
    setShape(parsed);
    setSelectedPlayerId(null);
    setError('');
    void persistLineup(slots, boxes, parsed).catch(() => {
      setError('Could not save shape');
    });
  }

  const poolPlayers = useMemo(() => {
    const inMatch = new Set([
      ...slots.filter((player): player is Player => Boolean(player)).map((player) => player.id),
      ...ROTATION_SLOTS.flatMap((slot) => boxes[slot].map((player) => player.id)),
    ]);
    return roster
      .filter((player) => !inMatch.has(player.id))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [roster, slots, boxes]);

  const squadRows = useMemo(() => {
    const onPitch = slots
      .filter((player): player is Player => Boolean(player))
      .map((player) => ({ player, where: 'On' as const }));
    const onBench = ROTATION_SLOTS.flatMap((slot) =>
      boxes[slot].map((player) => ({ player, where: 'Sub' as const })),
    );
    return [...onPitch, ...onBench];
  }, [slots, boxes]);

  async function persistLineup(
    nextSlots: Array<Player | null>,
    nextBoxes: RotationBoxes,
    nextShape: number[],
  ): Promise<MatchRecord | null> {
    const starterIds = nextSlots
      .map((player) => player?.id)
      .filter((id): id is string => Boolean(id));
    const updated = await api.updateRotationMatch(
      slug,
      match.id,
      starterIds,
      rotationBoxesToIds(nextBoxes),
      match.teamA.name,
      nextShape,
    );
    const keptFormation = parseRotationFormation(nextShape, format);
    const next = { ...updated, formation: keptFormation };
    onMatchChange(next);
    setShape(keptFormation);
    return next;
  }

  function addToMatch(player: Player) {
    const nextBoxes = cloneBoxes(boxes);
    nextBoxes[preferredRotationSlot(player)].push(player);
    setBoxes(nextBoxes);
    setSelectedPlayerId(null);
    setError('');
    window.clearTimeout(saveTimerRef.current);
    void persistLineup(slots, nextBoxes, shape).catch(() => {
      setError('Could not add player');
    });
  }

  function removeFromMatch(playerId: string) {
    const taken = takePlayer(slots, boxes, playerId);
    if (!taken) return;
    const nextSlots: Array<Player | null> = taken.nextSlots.filter(
      (player): player is Player => Boolean(player),
    );
    while (nextSlots.length < format) nextSlots.push(null);
    setSlots(nextSlots);
    setBoxes(taken.nextBoxes);
    setSelectedPlayerId(null);
    setError('');
    window.clearTimeout(saveTimerRef.current);
    void persistLineup(nextSlots, taken.nextBoxes, shape).catch(() => {
      setError('Could not remove player');
    });
  }

  async function saveLineup() {
    if (slots.some((player) => !player)) {
      setError(`Fill all ${format} starting places — extras go in the rotation boxes.`);
      return;
    }

    window.clearTimeout(saveTimerRef.current);
    setSaving(true);
    setError('');
    try {
      const saved = await persistLineup(slots, boxes, shape);
      if (!saved) {
        setError(`Fill all ${format} starting places — extras go in the rotation boxes.`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save lineup');
    } finally {
      setSaving(false);
    }
  }

  function applyMove(playerId: string, dest: { type: 'pitch'; index: number } | { type: 'bench'; slot: RotationSlot }) {
    setError('');
    const taken = takePlayer(slots, boxes, playerId);
    if (!taken) return;

    const { player, nextSlots, nextBoxes, from } = taken;

    if (dest.type === 'pitch') {
      if (from.type === 'pitch' && from.index === dest.index) {
        setSelectedPlayerId(null);
        return;
      }
      const occupant = nextSlots[dest.index];
      nextSlots[dest.index] = player;
      if (occupant && occupant.id !== player.id) {
        if (from.type === 'pitch') {
          nextSlots[from.index] = occupant;
        } else {
          nextBoxes[from.slot].push(occupant);
        }
      }
    } else {
      if (from.type === 'bench' && from.slot === dest.slot) {
        nextBoxes[dest.slot].unshift(player);
        setSlots(nextSlots);
        setBoxes(nextBoxes);
        setSelectedPlayerId(null);
        return;
      }
      nextBoxes[dest.slot].push(player);
    }

    setSlots(nextSlots);
    setBoxes(nextBoxes);
    setSelectedPlayerId(null);
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void persistLineup(nextSlots, nextBoxes, shape).catch(() => {
        setError('Could not save lineup');
      });
    }, 500);
  }

  async function handleRecordToggle(recorded: boolean) {
    if (recording) return;
    if (
      recorded &&
      !confirm(
        'Count this match as played?\n\nEveryone on the pitch and the bench gets +1 attendance. You can undo later.',
      )
    ) {
      return;
    }
    if (
      !recorded &&
      !confirm('Remove this match from games-played data? Player counts will decrease.')
    ) {
      return;
    }

    setRecording(true);
    setError('');
    try {
      if (recorded) {
        window.clearTimeout(saveTimerRef.current);
        const saved = await persistLineup(slots, boxes, shape);
        if (!saved) {
          setError('Could not save the lineup before counting it as played.');
          return;
        }
      }
      const result = await api.adminRecordMatch(slug, match.id, recorded);
      onMatchChange(result.match);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update record status');
    } finally {
      setRecording(false);
    }
  }

  async function handleShuffle() {
    if (shuffling) return;
    setShuffling(true);
    setError('');
    try {
      const newMatch = await api.generateMatch(
        slug,
        match.selectedPlayerIds,
        (match.name ?? '').trim(),
        2,
        { kind: 'rotation', format, formation: shape },
      );
      navigate(`/${slug}/match/${newMatch.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to reshuffle lineup');
      setShuffling(false);
    }
  }

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    setError('');
    try {
      window.clearTimeout(saveTimerRef.current);
      if (slots.some((player) => !player)) {
        setError(`Fill all ${format} starting places before sharing.`);
        return;
      }
      const saved = await persistLineup(slots, boxes, shape);
      if (!saved) {
        setError('Could not save lineup before sharing. Try Save lineup, then share again.');
        return;
      }
      const result = await shareMatchLineup({
        match: saved,
        groupName,
        captureEl: captureRef.current,
      });
      if (result === 'copied') {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setError('Could not share — try copying the link from your browser bar.');
    } finally {
      setSharing(false);
    }
  }

  const displayMatch = { ...match, formation: shape };
  const matchTitle = (match.name ?? '').trim() || getMatchLabel(displayMatch);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {groupName}
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900">{matchTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {getMatchLabel(displayMatch)}
            {formatMatchScore(match) ? ` · ${formatMatchScore(match)}` : ''}
            {' · '}
            {formatDate(match.date)}
            {match.external ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800 ring-1 ring-sky-200">
                External
              </span>
            ) : null}
            {match.recordedAsPlayed ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Counted as played
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <label className="btn-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-elite-600 focus:ring-elite-500"
                checked={Boolean(match.recordedAsPlayed)}
                disabled={recording || saving || shuffling || editing}
                onChange={(event) => void handleRecordToggle(event.target.checked)}
              />
              {recording ? 'Saving…' : 'Count as played'}
            </label>
          ) : null}
          <button
            type="button"
            className="btn-secondary"
            disabled={saving || shuffling}
            onClick={() => setEditing((open) => !open)}
          >
            <Pencil className="h-4 w-4" />
            {editing ? 'Done' : 'Edit teams'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={saving || shuffling || editing || !dirty}
            onClick={() => void saveLineup()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save lineup'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={saving || shuffling || editing}
            onClick={() => void handleShuffle()}
          >
            {shuffling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="h-4 w-4" />
            )}
            {shuffling ? 'Shuffling…' : 'Shuffle again'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={sharing || shuffling || editing}
            onClick={() => void handleShare()}
          >
            {sharing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {sharing ? 'Preparing…' : copied ? 'Copied' : 'Share'}
          </button>
          <Link to={`/${slug}`} className="btn-secondary">
            New match
          </Link>
          <Link to={`/${slug}/league`} className="btn-secondary">
            League
          </Link>
          <Link to={`/${slug}/history`} className="btn-secondary">
            History
          </Link>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Drag a brown sub onto an empty circle on the pitch, or tap the sub then tap the circle.
        Green = playing now, brown = bench.
        {editing
          ? ' Edit teams adds late arrivals to the bench or drops someone who did not play.'
          : ''}
        {isAdmin
          ? ' Tick Count as played so this night counts for attendance — including External games.'
          : ''}
      </p>

      <RotationShapePicker format={format} value={shape} onChange={applyShape} />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <MatchResultPanel
        slug={slug}
        match={match}
        admin={isAdmin}
        onMatchChange={onMatchChange}
      />

      {editing ? (
        <section className="card space-y-4 p-4 sm:p-5">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">Edit teams</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add late arrivals from the rest of the squad. They land on the brown bench — drag
              them onto a circle if they start. Remove anyone who did not play.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                In this match
              </p>
              {squadRows.length === 0 ? (
                <p className="text-sm text-slate-500">Nobody in this lineup yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {squadRows.map(({ player, where }) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-2 py-1.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                        {player.photoUrl ? (
                          <img src={player.photoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-slate-300" />
                        )}
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                        {player.name}
                      </p>
                      <span
                        className={
                          where === 'On'
                            ? 'text-[11px] font-semibold uppercase tracking-wide text-emerald-700'
                            : 'text-[11px] font-semibold uppercase tracking-wide text-amber-800'
                        }
                      >
                        {where}
                      </span>
                      <button
                        type="button"
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        disabled={saving}
                        onClick={() => removeFromMatch(player.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rest of squad
              </p>
              {poolPlayers.length === 0 ? (
                <p className="text-sm text-slate-500">Everyone is already in this match.</p>
              ) : (
                <div className="space-y-1.5">
                  {poolPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-2 py-1.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                        {player.photoUrl ? (
                          <img src={player.photoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-slate-300" />
                        )}
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                        {player.name}
                      </p>
                      <button
                        type="button"
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        disabled={saving}
                        onClick={() => addToMatch(player)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <div ref={captureRef} className="space-y-4 rounded-2xl bg-white p-3 sm:p-4">
        <RotationLineupBoard
          format={format}
          shape={shape}
          slots={slots}
          boxes={boxes}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
          onDropOnPitch={(playerId, index) => applyMove(playerId, { type: 'pitch', index })}
          onDropOnBench={(playerId, slot) => applyMove(playerId, { type: 'bench', slot })}
        />
      </div>
    </div>
  );
}
