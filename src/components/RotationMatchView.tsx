import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Loader2, Save, Share2, Shuffle } from 'lucide-react';
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

  async function persistLineup(
    nextSlots: Array<Player | null>,
    nextBoxes: RotationBoxes,
    nextShape: number[],
  ): Promise<MatchRecord | null> {
    if (nextSlots.some((player) => !player)) return null;
    const updated = await api.updateRotationMatch(
      slug,
      match.id,
      nextSlots.map((player) => player?.id).filter((id): id is string => Boolean(id)),
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
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            disabled={saving || shuffling || !dirty}
            onClick={() => void saveLineup()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save lineup'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={saving || shuffling}
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
            disabled={sharing || shuffling}
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
          <Link to={`/${slug}/history`} className="btn-secondary">
            History
          </Link>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Drag a brown sub onto an empty circle on the pitch, or tap the sub then tap the circle.
        Green = playing now, brown = bench.
      </p>

      <RotationShapePicker format={format} value={shape} onChange={applyShape} />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <MatchResultPanel
        slug={slug}
        match={match}
        admin={isAdmin}
        onMatchChange={onMatchChange}
      />

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
