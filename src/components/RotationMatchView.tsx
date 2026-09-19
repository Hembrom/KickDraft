import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Loader2, Save, Share2, Shuffle } from 'lucide-react';
import { RotationLineupBoard } from '@/components/RotationLineupBoard';
import { SessionWhoRatesWhom } from '@/components/SessionWhoRatesWhom';
import { api, ApiError } from '@/lib/api';
import { shareMatchLineup } from '@/lib/share-match';
import { formatDate } from '@/lib/utils';
import { enrichMatchWithRoster } from '@shared/match-utils';
import {
  ROTATION_SLOTS,
  emptyRotationBoxes,
  flattenRotation,
  isRotationFormat,
  rotationBoxesToIds,
} from '@shared/rotation-lineup';
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

function sessionPlayers(slots: Array<Player | null>, boxes: RotationBoxes): Player[] {
  return [...slots.filter((player): player is Player => Boolean(player)), ...flattenRotation(boxes)];
}

export function RotationMatchView({
  slug,
  groupName,
  match,
  roster,
  onMatchChange,
}: {
  slug: string;
  groupName: string;
  match: MatchRecord;
  roster: Player[];
  onMatchChange: (match: MatchRecord) => void;
}) {
  const navigate = useNavigate();
  const display = roster.length > 0 ? enrichMatchWithRoster(match, roster) : match;
  const format = isRotationFormat(match.format) ? match.format : 5;
  const captureRef = useRef<HTMLDivElement>(null);

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
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const dirty = useMemo(() => {
    const startIds = slots.map((player) => player?.id ?? '').join(',');
    const savedStart = initialSlots.map((player) => player?.id ?? '').join(',');
    if (startIds !== savedStart) return true;
    return ROTATION_SLOTS.some(
      (slot) =>
        boxes[slot].map((player) => player.id).join(',') !==
        initialBoxes[slot].map((player) => player.id).join(','),
    );
  }, [slots, boxes, initialSlots, initialBoxes]);

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
  }

  async function saveLineup() {
    if (slots.some((player) => !player)) {
      setError(`Fill all ${format} starting places — extras go in the rotation boxes.`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const updated = await api.updateRotationMatch(
        slug,
        match.id,
        slots.map((player) => player?.id).filter((id): id is string => Boolean(id)),
        rotationBoxesToIds(boxes),
        match.teamA.name,
      );
      onMatchChange(updated);
      const next = roster.length > 0 ? enrichMatchWithRoster(updated, roster) : updated;
      setSlots(() => {
        const filled = [...next.teamA.players];
        const nextSlots: Array<Player | null> = filled.slice(0, format);
        while (nextSlots.length < format) nextSlots.push(null);
        return nextSlots;
      });
      setBoxes(next.rotation ?? emptyRotationBoxes());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save lineup');
    } finally {
      setSaving(false);
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
        { kind: 'rotation', format },
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
      const result = await shareMatchLineup({
        match,
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

  const people = sessionPlayers(slots, boxes);
  const matchTitle = (match.name ?? '').trim() || getMatchLabel(match);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {groupName}
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900">{matchTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {getMatchLabel(match)} · {formatDate(match.date)}
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
        Starting {format} on the pitch. Each rotation box shows that position —{' '}
        <span className="font-semibold text-emerald-700">green = playing now</span>, grey = sub
        who can rotate in.
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div ref={captureRef} className="space-y-4 rounded-2xl bg-white p-3 sm:p-4">
        <RotationLineupBoard
          format={format}
          slots={slots}
          boxes={boxes}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
          onDropOnPitch={(playerId, index) => applyMove(playerId, { type: 'pitch', index })}
          onDropOnBench={(playerId, slot) => applyMove(playerId, { type: 'bench', slot })}
        />
      </div>

      <SessionWhoRatesWhom slug={slug} players={people} />
    </div>
  );
}
