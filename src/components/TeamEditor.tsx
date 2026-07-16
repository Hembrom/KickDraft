import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Loader2,
  Save,
  Undo2,
  User,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PositionBadge } from './PlayerCard';
import { roundRating, type Player } from '@shared/types';

export type EditorTeam = 'a' | 'b';
export type EditTab = 'lock' | 'manual';

type DragSource = EditorTeam | 'pool';

interface DragPayload {
  source: DragSource;
  playerId: string;
}

const DRAG_MIME = 'application/x-kickdraft-player';

function PlayerAvatar({ player }: { player: Player }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
      {player.photoUrl ? (
        <img src={player.photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <User className="h-5 w-5 text-slate-300" />
      )}
    </div>
  );
}

function PlayerSummary({ player }: { player: Player }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1">
        <span className="truncate text-sm font-semibold text-slate-900">{player.name}</span>
        {player.positions.map((position) => (
          <PositionBadge key={position} position={position} />
        ))}
      </div>
      <span className="text-xs font-bold text-elite-600">OVR {roundRating(player.ovr)}</span>
    </div>
  );
}

function TeamColumn({
  name,
  team,
  players,
  capacity,
  dropTargetTeam,
  dropTargetId,
  onReturnToPool,
  onDragStart,
  onDragOverPlayer,
  onDropOnPlayer,
  onDropOnTeam,
  onDragEnd,
}: {
  name: string;
  team: EditorTeam;
  players: Player[];
  capacity: number;
  dropTargetTeam: DragSource | null;
  dropTargetId: string | null;
  onReturnToPool: (playerId: string) => void;
  onDragStart: (source: DragSource, playerId: string) => void;
  onDragOverPlayer: (team: EditorTeam, playerId: string) => void;
  onDropOnPlayer: (team: EditorTeam, playerId: string) => void;
  onDropOnTeam: (team: EditorTeam) => void;
  onDragEnd: () => void;
}) {
  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDropOnTeam(team);
      }}
      className={cn(
        'min-h-[280px] overflow-hidden rounded-2xl border bg-white transition',
        dropTargetTeam === team ? 'border-elite-400 ring-2 ring-elite-100' : 'border-slate-200',
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
        <h3 className="font-display font-bold text-slate-900">{name}</h3>
        <span className="text-xs text-slate-500">
          {players.length}/{capacity}
        </span>
      </div>
      <div className="space-y-2 p-2">
        {players.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-slate-400">
            Drop players here
          </p>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              draggable
              onDragStart={(event) => {
                const payload: DragPayload = { source: team, playerId: player.id };
                event.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
                event.dataTransfer.setData('text/plain', player.id);
                event.dataTransfer.effectAllowed = 'move';
                onDragStart(team, player.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = 'move';
                onDragOverPlayer(team, player.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDropOnPlayer(team, player.id);
              }}
              onDragEnd={onDragEnd}
              className={cn(
                'flex items-center gap-2 rounded-xl border p-2 transition',
                dropTargetId === player.id
                  ? 'border-elite-400 bg-elite-50/80 ring-1 ring-elite-200'
                  : 'border-slate-200 bg-slate-50/60',
              )}
            >
              <span className="shrink-0 cursor-grab text-slate-400 active:cursor-grabbing" aria-hidden>
                <GripVertical className="h-4 w-4" />
              </span>
              <PlayerAvatar player={player} />
              <PlayerSummary player={player} />
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                onClick={() => onReturnToPool(player.id)}
                aria-label={`Return ${player.name} to pool`}
                title="Back to pool"
              >
                <Undo2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function PlayerPool({
  players,
  dropTargetTeam,
  onMoveToTeam,
  onDragStart,
  onDropOnPool,
  onDragEnd,
}: {
  players: Player[];
  dropTargetTeam: DragSource | null;
  onMoveToTeam: (playerId: string, targetTeam: EditorTeam) => void;
  onDragStart: (source: DragSource, playerId: string) => void;
  onDropOnPool: () => void;
  onDragEnd: () => void;
}) {
  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDropOnPool();
      }}
      className={cn(
        'overflow-hidden rounded-2xl border bg-white transition',
        dropTargetTeam === 'pool' ? 'border-elite-400 ring-2 ring-elite-100' : 'border-slate-200',
      )}
    >
      <div className="border-b border-slate-200 px-3 py-2.5">
        <h3 className="font-display font-bold text-slate-900">Players</h3>
        <p className="text-xs text-slate-500">
          {players.length} left · click ← / → or drag to a team
        </p>
      </div>
      <div className="max-h-[620px] space-y-2 overflow-y-auto p-2">
        {players.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-slate-400">
            All players assigned
          </p>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              draggable
              onDragStart={(event) => {
                const payload: DragPayload = { source: 'pool', playerId: player.id };
                event.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
                event.dataTransfer.setData('text/plain', player.id);
                event.dataTransfer.effectAllowed = 'move';
                onDragStart('pool', player.id);
              }}
              onDragEnd={onDragEnd}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2"
            >
              <span className="shrink-0 cursor-grab text-slate-400 active:cursor-grabbing" aria-hidden>
                <GripVertical className="h-4 w-4" />
              </span>
              <PlayerAvatar player={player} />
              <PlayerSummary player={player} />
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                  onClick={() => onMoveToTeam(player.id, 'a')}
                  aria-label={`Move ${player.name} to Team A`}
                  title="Team A"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:text-red-700"
                  onClick={() => onMoveToTeam(player.id, 'b')}
                  aria-label={`Move ${player.name} to Team B`}
                  title="Team B"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function TeamEditor({
  tab,
  onTabChange,
  teamAPlayers,
  teamBPlayers,
  poolPlayers,
  teamACapacity,
  teamBCapacity,
  busy,
  canSave,
  onMoveToTeam,
  onReturnToPool,
  onReorder,
  onSwap,
  onFillRest,
  onSave,
  onCancel,
}: {
  tab: EditTab;
  onTabChange: (tab: EditTab) => void;
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  poolPlayers: Player[];
  teamACapacity: number;
  teamBCapacity: number;
  busy: boolean;
  canSave: boolean;
  onMoveToTeam: (playerId: string, targetTeam: EditorTeam) => void;
  onReturnToPool: (playerId: string) => void;
  onReorder: (team: EditorTeam, fromPlayerId: string, toPlayerId: string) => void;
  onSwap: (fromTeam: EditorTeam, fromPlayerId: string, toTeam: EditorTeam, toPlayerId: string) => void;
  onFillRest: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [dragging, setDragging] = useState<DragPayload | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropTargetTeam, setDropTargetTeam] = useState<DragSource | null>(null);

  const resetDrag = () => {
    setDragging(null);
    setDropTargetId(null);
    setDropTargetTeam(null);
  };

  function handleDropOnPlayer(toTeam: EditorTeam, toPlayerId: string) {
    if (!dragging || dragging.playerId === toPlayerId) {
      resetDrag();
      return;
    }

    if (dragging.source === 'pool') {
      onMoveToTeam(dragging.playerId, toTeam);
    } else if (dragging.source === toTeam) {
      onReorder(toTeam, dragging.playerId, toPlayerId);
    } else {
      onSwap(dragging.source, dragging.playerId, toTeam, toPlayerId);
    }

    resetDrag();
  }

  function handleDropOnTeam(toTeam: EditorTeam) {
    if (!dragging) {
      resetDrag();
      return;
    }
    onMoveToTeam(dragging.playerId, toTeam);
    resetDrag();
  }

  function handleDropOnPool() {
    if (!dragging || dragging.source === 'pool') {
      resetDrag();
      return;
    }
    onReturnToPool(dragging.playerId);
    resetDrag();
  }

  return (
    <section className="card space-y-4 p-4">
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900">Edit teams</h2>
        <div className="mt-3 flex gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition',
              tab === 'lock'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
            onClick={() => onTabChange('lock')}
          >
            Lock &amp; shuffle
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition',
              tab === 'manual'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
            onClick={() => onTabChange('manual')}
          >
            Manual
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {tab === 'lock'
            ? 'Place the players you want fixed on each side, then Fill rest of teams to balance the remaining players.'
            : 'Assign everyone yourself with ← / → or drag and drop. Nothing is auto-filled.'}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)_minmax(0,1fr)]">
        <TeamColumn
          name="Team A"
          team="a"
          players={teamAPlayers}
          capacity={teamACapacity}
          dropTargetTeam={dropTargetTeam}
          dropTargetId={dropTargetId}
          onReturnToPool={onReturnToPool}
          onDragStart={(source, playerId) => setDragging({ source, playerId })}
          onDragOverPlayer={(team, playerId) => {
            setDropTargetTeam(team);
            setDropTargetId(playerId);
          }}
          onDropOnPlayer={handleDropOnPlayer}
          onDropOnTeam={handleDropOnTeam}
          onDragEnd={resetDrag}
        />
        <PlayerPool
          players={poolPlayers}
          dropTargetTeam={dropTargetTeam}
          onMoveToTeam={onMoveToTeam}
          onDragStart={(source, playerId) => setDragging({ source, playerId })}
          onDropOnPool={handleDropOnPool}
          onDragEnd={resetDrag}
        />
        <TeamColumn
          name="Team B"
          team="b"
          players={teamBPlayers}
          capacity={teamBCapacity}
          dropTargetTeam={dropTargetTeam}
          dropTargetId={dropTargetId}
          onReturnToPool={onReturnToPool}
          onDragStart={(source, playerId) => setDragging({ source, playerId })}
          onDragOverPlayer={(team, playerId) => {
            setDropTargetTeam(team);
            setDropTargetId(playerId);
          }}
          onDropOnPlayer={handleDropOnPlayer}
          onDropOnTeam={handleDropOnTeam}
          onDragEnd={resetDrag}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {tab === 'lock' ? (
          <button type="button" className="btn-secondary" disabled={busy} onClick={onFillRest}>
            <Wand2 className="h-4 w-4" />
            Fill rest of teams
          </button>
        ) : null}
        <button type="button" className="btn-primary" disabled={busy || !canSave} onClick={onSave}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {busy ? 'Saving…' : 'Save teams'}
        </button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </section>
  );
}
