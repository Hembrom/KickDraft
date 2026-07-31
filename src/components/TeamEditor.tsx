import { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
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

export type EditorTeam = 'a' | 'b' | 'c';
export type EditTab = 'swap' | 'lock' | 'manual';

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
  nameEditable = false,
  onNameChange,
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
  nameEditable?: boolean;
  onNameChange?: (name: string) => void;
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
        'min-h-[180px] overflow-hidden rounded-2xl border bg-white transition xl:min-h-[280px]',
        dropTargetTeam === team ? 'border-elite-400 ring-2 ring-elite-100' : 'border-slate-200',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          {nameEditable ? (
            <input
              className="input w-full py-1.5 font-display text-sm font-bold"
              value={name}
              onChange={(event) => onNameChange?.(event.target.value)}
              placeholder={`Team ${team.toUpperCase()}`}
              maxLength={40}
              aria-label={`Team ${team.toUpperCase()} name`}
            />
          ) : (
            <h3 className="flex items-center gap-1.5 font-display font-bold text-slate-900">
              {name}
              {team === 'a' ? (
                <ArrowUp className="h-4 w-4 text-blue-600 xl:hidden" aria-hidden />
              ) : team === 'b' ? (
                <ArrowDown className="h-4 w-4 text-red-600 xl:hidden" aria-hidden />
              ) : (
                <span className="text-[10px] font-bold text-amber-700 xl:hidden">C</span>
              )}
            </h3>
          )}
        </div>
        <span className="shrink-0 text-xs text-slate-500">
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
  threeTeam,
  onMoveToTeam,
  onDragStart,
  onDropOnPool,
  onDragEnd,
}: {
  players: Player[];
  dropTargetTeam: DragSource | null;
  threeTeam?: boolean;
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
          <span className="xl:hidden">
            {players.length} left · tap {threeTeam ? 'A / B / C' : '↑ / ↓'} to assign
          </span>
          <span className="hidden xl:inline">
            {players.length} left · click team arrows or drag to a team
          </span>
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
                {threeTeam ? (
                  <>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-blue-700 hover:border-blue-300"
                      onClick={() => onMoveToTeam(player.id, 'a')}
                      aria-label={`Move ${player.name} to Team A`}
                      title="Team A"
                    >
                      A
                    </button>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-red-700 hover:border-red-300"
                      onClick={() => onMoveToTeam(player.id, 'b')}
                      aria-label={`Move ${player.name} to Team B`}
                      title="Team B"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-amber-700 hover:border-amber-300"
                      onClick={() => onMoveToTeam(player.id, 'c')}
                      aria-label={`Move ${player.name} to Team C`}
                      title="Team C"
                    >
                      C
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                      onClick={() => onMoveToTeam(player.id, 'a')}
                      aria-label={`Move ${player.name} to Team A`}
                      title="Team A"
                    >
                      <ArrowUp className="h-4 w-4 xl:hidden" />
                      <ArrowLeft className="hidden h-4 w-4 xl:block" />
                    </button>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:text-red-700"
                      onClick={() => onMoveToTeam(player.id, 'b')}
                      aria-label={`Move ${player.name} to Team B`}
                      title="Team B"
                    >
                      <ArrowDown className="h-4 w-4 xl:hidden" />
                      <ArrowRight className="hidden h-4 w-4 xl:block" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function QuickSwapPanel({
  teamAName,
  teamBName,
  teamAPlayers,
  teamBPlayers,
  selectedAId,
  selectedBId,
  onSelectA,
  onSelectB,
  onSwap,
}: {
  teamAName: string;
  teamBName: string;
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  selectedAId: string | null;
  selectedBId: string | null;
  onSelectA: (playerId: string) => void;
  onSelectB: (playerId: string) => void;
  onSwap: (teamAPlayerId: string, teamBPlayerId: string) => void;
}) {
  const selectedA = teamAPlayers.find((player) => player.id === selectedAId) ?? null;
  const selectedB = teamBPlayers.find((player) => player.id === selectedBId) ?? null;
  const pairReady = Boolean(selectedAId && selectedBId);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <section className="overflow-hidden rounded-2xl border border-blue-200 bg-white">
        <div className="border-b border-blue-100 bg-blue-50 px-3 py-2.5">
          <h3 className="font-display font-bold text-slate-900">{teamAName}</h3>
          <p className="text-xs text-slate-500">{teamAPlayers.length} players · tap → to swap right</p>
        </div>
        <div className="max-h-[520px] space-y-2 overflow-y-auto p-2">
          {teamAPlayers.map((player) => {
            const canSwapWithTarget = Boolean(selectedBId);
            return (
              <div
                key={player.id}
                className={cn(
                  'flex items-center gap-2 rounded-xl border p-2 transition',
                  selectedAId === player.id
                    ? 'border-blue-400 bg-blue-50/80 ring-1 ring-blue-200'
                    : 'border-slate-200 bg-slate-50/60',
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelectA(player.id)}
                >
                  <div className="flex items-center gap-2">
                    <PlayerAvatar player={player} />
                    <PlayerSummary player={player} />
                  </div>
                </button>
                <button
                  type="button"
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                    canSwapWithTarget
                      ? 'border-blue-300 bg-white text-blue-700 hover:bg-blue-50'
                      : 'border-slate-200 bg-slate-100 text-slate-400',
                  )}
                  disabled={!selectedBId}
                  onClick={() => {
                    if (selectedBId) onSwap(player.id, selectedBId);
                    else onSelectA(player.id);
                  }}
                  aria-label={`Swap ${player.name} to ${teamBName}`}
                  title={selectedBId ? `Swap with ${teamBName}` : `Select ${player.name}, then pick someone on ${teamBName}`}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col items-center justify-center gap-2 px-1">
        <p className="max-w-[12rem] text-center text-xs text-slate-500 lg:max-w-[7rem]">
          {pairReady
            ? selectedA && selectedB
              ? `${selectedA.name} ↔ ${selectedB.name}`
              : 'Ready to swap'
            : 'Pick one player on each side'}
        </p>
        <button
          type="button"
          className="btn-primary px-4 py-2 text-sm"
          disabled={!pairReady}
          onClick={() => {
            if (selectedAId && selectedBId) onSwap(selectedAId, selectedBId);
          }}
        >
          Swap
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-red-200 bg-white">
        <div className="border-b border-red-100 bg-red-50 px-3 py-2.5">
          <h3 className="font-display font-bold text-slate-900">{teamBName}</h3>
          <p className="text-xs text-slate-500">{teamBPlayers.length} players · tap ← to swap left</p>
        </div>
        <div className="max-h-[520px] space-y-2 overflow-y-auto p-2">
          {teamBPlayers.map((player) => {
            const canSwapWithTarget = Boolean(selectedAId);
            return (
              <div
                key={player.id}
                className={cn(
                  'flex items-center gap-2 rounded-xl border p-2 transition',
                  selectedBId === player.id
                    ? 'border-red-400 bg-red-50/80 ring-1 ring-red-200'
                    : 'border-slate-200 bg-slate-50/60',
                )}
              >
                <button
                  type="button"
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border lg:order-first',
                    canSwapWithTarget
                      ? 'border-red-300 bg-white text-red-700 hover:bg-red-50'
                      : 'border-slate-200 bg-slate-100 text-slate-400',
                  )}
                  disabled={!selectedAId}
                  onClick={() => {
                    if (selectedAId) onSwap(selectedAId, player.id);
                    else onSelectB(player.id);
                  }}
                  aria-label={`Swap ${player.name} to ${teamAName}`}
                  title={selectedAId ? `Swap with ${teamAName}` : `Select ${player.name}, then pick someone on ${teamAName}`}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelectB(player.id)}
                >
                  <div className="flex items-center gap-2">
                    <PlayerAvatar player={player} />
                    <PlayerSummary player={player} />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function TeamEditor({
  tab,
  onTabChange,
  teamCount = 2,
  teamAPlayers,
  teamBPlayers,
  teamCPlayers = [],
  poolPlayers,
  teamAName,
  teamBName,
  teamCName,
  onTeamNameChange,
  teamACapacity,
  teamBCapacity,
  teamCCapacity = 0,
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
  teamCount?: 2 | 3;
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  teamCPlayers?: Player[];
  poolPlayers: Player[];
  teamAName?: string;
  teamBName?: string;
  teamCName?: string;
  onTeamNameChange?: (team: EditorTeam, name: string) => void;
  teamACapacity: number;
  teamBCapacity: number;
  teamCCapacity?: number;
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
  const threeTeam = teamCount === 3;
  const showQuickSwap = tab === 'swap' && !threeTeam;
  const [dragging, setDragging] = useState<DragPayload | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropTargetTeam, setDropTargetTeam] = useState<DragSource | null>(null);
  const [selectedSwapAId, setSelectedSwapAId] = useState<string | null>(null);
  const [selectedSwapBId, setSelectedSwapBId] = useState<string | null>(null);

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
          {!threeTeam ? (
            <button
              type="button"
              className={cn(
                'flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition',
                tab === 'swap'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
              onClick={() => onTabChange('swap')}
            >
              Quick swap
            </button>
          ) : null}
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
          {tab === 'swap'
            ? 'Current lineups are loaded. Pick one player on each side, then tap Swap or use → / ←.'
            : tab === 'lock'
              ? threeTeam
                ? 'Name each team, place the players you want fixed, then Fill rest of teams to balance the remainder.'
                : 'Place the players you want fixed on each side, then Fill rest of teams to balance the remaining players.'
              : threeTeam
                ? 'Name each team and assign everyone with A / B / C or drag and drop.'
                : 'Assign everyone yourself with the team arrows or drag and drop. Nothing is auto-filled.'}
        </p>
      </div>

      {showQuickSwap ? (
        <QuickSwapPanel
          teamAName={teamAName ?? 'Team A'}
          teamBName={teamBName ?? 'Team B'}
          teamAPlayers={teamAPlayers}
          teamBPlayers={teamBPlayers}
          selectedAId={selectedSwapAId}
          selectedBId={selectedSwapBId}
          onSelectA={setSelectedSwapAId}
          onSelectB={setSelectedSwapBId}
          onSwap={(teamAPlayerId, teamBPlayerId) => {
            onSwap('a', teamAPlayerId, 'b', teamBPlayerId);
            setSelectedSwapAId(null);
            setSelectedSwapBId(null);
          }}
        />
      ) : (
      <div
        className={cn(
          'grid gap-4',
          threeTeam
            ? 'xl:grid-cols-[minmax(280px,0.95fr)_repeat(3,minmax(0,1fr))]'
            : 'xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)_minmax(0,1fr)]',
        )}
      >
        {threeTeam ? (
          <PlayerPool
            players={poolPlayers}
            dropTargetTeam={dropTargetTeam}
            threeTeam
            onMoveToTeam={onMoveToTeam}
            onDragStart={(source, playerId) => setDragging({ source, playerId })}
            onDropOnPool={handleDropOnPool}
            onDragEnd={resetDrag}
          />
        ) : null}
        <TeamColumn
          name={teamAName ?? 'Team A'}
          team="a"
          players={teamAPlayers}
          capacity={teamACapacity}
          nameEditable={threeTeam}
          onNameChange={threeTeam ? (name) => onTeamNameChange?.('a', name) : undefined}
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
        {!threeTeam ? (
          <PlayerPool
            players={poolPlayers}
            dropTargetTeam={dropTargetTeam}
            onMoveToTeam={onMoveToTeam}
            onDragStart={(source, playerId) => setDragging({ source, playerId })}
            onDropOnPool={handleDropOnPool}
            onDragEnd={resetDrag}
          />
        ) : null}
        <TeamColumn
          name={teamBName ?? 'Team B'}
          team="b"
          players={teamBPlayers}
          capacity={teamBCapacity}
          nameEditable={threeTeam}
          onNameChange={threeTeam ? (name) => onTeamNameChange?.('b', name) : undefined}
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
        {threeTeam ? (
          <TeamColumn
            name={teamCName ?? 'Team C'}
            team="c"
            players={teamCPlayers}
            capacity={teamCCapacity}
            nameEditable={threeTeam}
            onNameChange={threeTeam ? (name) => onTeamNameChange?.('c', name) : undefined}
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
        ) : null}
      </div>
      )}

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
