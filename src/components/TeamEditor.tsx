import { useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  GripVertical,
  Loader2,
  Lock,
  Save,
  Shuffle,
  Unlock,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PositionBadge } from './PlayerCard';
import { roundRating, type Player } from '@shared/types';

export type EditorTeam = 'a' | 'b';

export interface SelectedEditorPlayer {
  team: EditorTeam;
  playerId: string;
}

interface DragPayload {
  team: EditorTeam;
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

function EditTeamColumn({
  name,
  team,
  players,
  lockedIds,
  selected,
  dropTargetId,
  dropTargetTeam,
  onToggleLock,
  onSelect,
  onDragStart,
  onDragOverPlayer,
  onDropOnPlayer,
  onDropOnTeam,
  onDragEnd,
}: {
  name: string;
  team: EditorTeam;
  players: Player[];
  lockedIds: Set<string>;
  selected: SelectedEditorPlayer | null;
  dropTargetId: string | null;
  dropTargetTeam: EditorTeam | null;
  onToggleLock: (team: EditorTeam, playerId: string) => void;
  onSelect: (team: EditorTeam, playerId: string) => void;
  onDragStart: (team: EditorTeam, playerId: string) => void;
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
        'overflow-hidden rounded-2xl border bg-white transition',
        dropTargetTeam === team ? 'border-elite-400 ring-2 ring-elite-100' : 'border-slate-200',
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
        <h3 className="font-display font-bold text-slate-900">{name}</h3>
        <span className="text-xs text-slate-500">
          {players.length} players · {lockedIds.size}/4 locked
        </span>
      </div>
      <div className="space-y-2 p-2">
        {players.map((player) => {
          const isLocked = lockedIds.has(player.id);
          const isSelected = selected?.team === team && selected.playerId === player.id;
          const isDropTarget = dropTargetId === player.id;
          return (
            <div
              key={player.id}
              draggable
              onDragStart={(event) => {
                const payload: DragPayload = { team, playerId: player.id };
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
                isSelected
                  ? 'border-elite-500 bg-elite-50 ring-2 ring-elite-200'
                  : isDropTarget
                    ? 'border-elite-400 bg-elite-50/80 ring-1 ring-elite-200'
                    : 'border-slate-200 bg-slate-50/60',
              )}
            >
              <span className="shrink-0 cursor-grab text-slate-400 active:cursor-grabbing" aria-hidden title="Drag to move">
                <GripVertical className="h-4 w-4" />
              </span>
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => onSelect(team, player.id)}
                aria-pressed={isSelected}
                aria-label={`Select ${player.name} to swap`}
              >
                <PlayerAvatar player={player} />
                <PlayerSummary player={player} />
              </button>
              <button
                type="button"
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition',
                  isLocked
                    ? 'border-amber-300 bg-amber-100 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                )}
                onClick={() => onToggleLock(team, player.id)}
                aria-label={`${isLocked ? 'Unlock' : 'Lock'} ${player.name}`}
                title={`${isLocked ? 'Unlock' : 'Lock'} ${player.name}`}
              >
                {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PlayerAssignmentList({
  players,
  getTeam,
  onMoveToTeam,
  onDragStart,
  onDragEnd,
}: {
  players: Player[];
  getTeam: (playerId: string) => EditorTeam;
  onMoveToTeam: (playerId: string, targetTeam: EditorTeam) => void;
  onDragStart: (team: EditorTeam, playerId: string) => void;
  onDragEnd: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-3 py-2.5">
        <h3 className="font-display font-bold text-slate-900">Players</h3>
        <p className="text-xs text-slate-500">Click left/right, or drag to a team.</p>
      </div>
      <div className="max-h-[620px] space-y-2 overflow-y-auto p-2">
        {players.map((player) => {
          const currentTeam = getTeam(player.id);
          return (
            <div
              key={player.id}
              draggable
              onDragStart={(event) => {
                const payload: DragPayload = { team: currentTeam, playerId: player.id };
                event.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
                event.dataTransfer.setData('text/plain', player.id);
                event.dataTransfer.effectAllowed = 'move';
                onDragStart(currentTeam, player.id);
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
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold transition',
                    currentTeam === 'a'
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300',
                  )}
                  onClick={() => onMoveToTeam(player.id, 'a')}
                  aria-label={`Move ${player.name} to Team A`}
                  title="Move to Team A"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold transition',
                    currentTeam === 'b'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-red-300',
                  )}
                  onClick={() => onMoveToTeam(player.id, 'b')}
                  aria-label={`Move ${player.name} to Team B`}
                  title="Move to Team B"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TeamEditor({
  teamAPlayers,
  teamBPlayers,
  lockedA,
  lockedB,
  selected,
  busy,
  onToggleLock,
  onSelect,
  onSwap,
  onReorder,
  onMoveToTeam,
  onShuffle,
  onSave,
  onCancel,
}: {
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  lockedA: Set<string>;
  lockedB: Set<string>;
  selected: SelectedEditorPlayer | null;
  busy: boolean;
  onToggleLock: (team: EditorTeam, playerId: string) => void;
  onSelect: (team: EditorTeam, playerId: string) => void;
  onSwap: (fromTeam: EditorTeam, fromPlayerId: string, toTeam: EditorTeam, toPlayerId: string) => void;
  onReorder: (team: EditorTeam, fromPlayerId: string, toPlayerId: string) => void;
  onMoveToTeam: (playerId: string, targetTeam: EditorTeam) => void;
  onShuffle: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [dragging, setDragging] = useState<DragPayload | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropTargetTeam, setDropTargetTeam] = useState<EditorTeam | null>(null);
  const allPlayers = [...teamAPlayers, ...teamBPlayers];

  const resetDrag = () => {
    setDragging(null);
    setDropTargetId(null);
    setDropTargetTeam(null);
  };

  function getTeam(playerId: string): EditorTeam {
    return teamAPlayers.some((player) => player.id === playerId) ? 'a' : 'b';
  }

  function handleDropOnPlayer(toTeam: EditorTeam, toPlayerId: string) {
    if (!dragging || dragging.playerId === toPlayerId) {
      resetDrag();
      return;
    }

    if (dragging.team === toTeam) {
      onReorder(toTeam, dragging.playerId, toPlayerId);
    } else {
      onSwap(dragging.team, dragging.playerId, toTeam, toPlayerId);
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

  return (
    <section className="card space-y-4 p-4">
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900">Edit teams</h2>
        <p className="mt-1 text-sm text-slate-600">
          Team A is left, Team B is right, and all players are in the middle. Click the arrows or
          drag players to assign; dropping onto another player swaps them.
        </p>
      </div>

      {selected ? (
        <div className="flex items-center gap-2 rounded-xl bg-elite-50 px-3 py-2 text-sm text-elite-800">
          <ArrowLeftRight className="h-4 w-4" />
          Now choose a player on the other team to swap.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)_minmax(0,1fr)]">
        <EditTeamColumn
          name="Team A"
          team="a"
          players={teamAPlayers}
          lockedIds={lockedA}
          selected={selected}
          dropTargetId={dropTargetId}
          dropTargetTeam={dropTargetTeam}
          onToggleLock={onToggleLock}
          onSelect={onSelect}
          onDragStart={(team, playerId) => setDragging({ team, playerId })}
          onDragOverPlayer={(team, playerId) => {
            setDropTargetTeam(team);
            setDropTargetId(playerId);
          }}
          onDropOnPlayer={handleDropOnPlayer}
          onDropOnTeam={handleDropOnTeam}
          onDragEnd={resetDrag}
        />

        <PlayerAssignmentList
          players={allPlayers}
          getTeam={getTeam}
          onMoveToTeam={onMoveToTeam}
          onDragStart={(team, playerId) => setDragging({ team, playerId })}
          onDragEnd={resetDrag}
        />

        <EditTeamColumn
          name="Team B"
          team="b"
          players={teamBPlayers}
          lockedIds={lockedB}
          selected={selected}
          dropTargetId={dropTargetId}
          dropTargetTeam={dropTargetTeam}
          onToggleLock={onToggleLock}
          onSelect={onSelect}
          onDragStart={(team, playerId) => setDragging({ team, playerId })}
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
        <button type="button" className="btn-secondary" disabled={busy} onClick={onShuffle}>
          <Shuffle className="h-4 w-4" />
          Shuffle unlocked
        </button>
        <button type="button" className="btn-primary" disabled={busy} onClick={onSave}>
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
