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

function MultiTeamSwapPanel({
  teams,
  poolPlayers,
  poolLabel = 'Rest of squad',
  selected,
  onSelect,
  onSwapPair,
}: {
  teams: Array<{ key: EditorTeam; name: string; players: Player[]; accent: string }>;
  poolPlayers: Player[];
  poolLabel?: string;
  selected: { source: DragSource; playerId: string } | null;
  onSelect: (source: DragSource, playerId: string) => void;
  onSwapPair: (
    from: DragSource,
    fromPlayerId: string,
    to: DragSource,
    toPlayerId: string,
  ) => void;
}) {
  function handlePick(source: DragSource, playerId: string) {
    if (!selected) {
      onSelect(source, playerId);
      return;
    }
    if (selected.source === source && selected.playerId === playerId) {
      onSelect(source, playerId);
      return;
    }
    if (selected.source === source) {
      onSelect(source, playerId);
      return;
    }
    onSwapPair(selected.source, selected.playerId, source, playerId);
  }

  const selectedName = (() => {
    if (!selected) return null;
    if (selected.source === 'pool') {
      return poolPlayers.find((p) => p.id === selected.playerId)?.name ?? null;
    }
    const team = teams.find((t) => t.key === selected.source);
    return team?.players.find((p) => p.id === selected.playerId)?.name ?? null;
  })();

  const columns: Array<{
    key: DragSource;
    name: string;
    players: Player[];
    headerClass: string;
    borderClass: string;
    selectedBorder: string;
  }> = [
    ...teams.map((team) => ({
      key: team.key as DragSource,
      name: team.name,
      players: team.players,
      headerClass: team.accent,
      borderClass: 'border-slate-200',
      selectedBorder: 'border-elite-400 bg-elite-50/80 ring-1 ring-elite-200',
    })),
    {
      key: 'pool' as DragSource,
      name: poolLabel,
      players: poolPlayers,
      headerClass: 'border-b border-slate-100 bg-slate-50',
      borderClass: 'border-slate-200',
      selectedBorder: 'border-elite-400 bg-elite-50/80 ring-1 ring-elite-200',
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        {selected
          ? selectedName
            ? `Selected ${selectedName} — tap another player (any team or rest) to swap`
            : 'Selected — tap another player to swap'
          : 'Tap one player, then tap another on a different list to swap them.'}
      </p>
      <div
        className={cn(
          'grid gap-3',
          columns.length >= 4
            ? 'xl:grid-cols-4'
            : columns.length === 3
              ? 'lg:grid-cols-3'
              : 'lg:grid-cols-2',
        )}
      >
        {columns.map((col) => (
          <section
            key={col.key}
            className={cn('overflow-hidden rounded-2xl border bg-white', col.borderClass)}
          >
            <div className={cn('border-b px-3 py-2.5', col.headerClass)}>
              <h3 className="font-display font-bold text-slate-900">{col.name}</h3>
              <p className="text-xs text-slate-500">{col.players.length} players</p>
            </div>
            <div className="max-h-[480px] space-y-2 overflow-y-auto p-2">
              {col.players.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
                  Empty
                </p>
              ) : (
                col.players.map((player) => {
                  const isSelected =
                    selected?.source === col.key && selected.playerId === player.id;
                  return (
                    <button
                      key={player.id}
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-2 rounded-xl border p-2 text-left transition',
                        isSelected
                          ? col.selectedBorder
                          : 'border-slate-200 bg-slate-50/60 hover:border-elite-200',
                      )}
                      onClick={() => handlePick(col.key, player.id)}
                    >
                      <PlayerAvatar player={player} />
                      <PlayerSummary player={player} />
                    </button>
                  );
                })
              )}
            </div>
          </section>
        ))}
      </div>
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
  onSwap: (
    from: DragSource,
    fromPlayerId: string,
    to: DragSource,
    toPlayerId: string,
  ) => void;
  onFillRest: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const threeTeam = teamCount === 3;
  const showQuickSwap = tab === 'swap';
  const [dragging, setDragging] = useState<DragPayload | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropTargetTeam, setDropTargetTeam] = useState<DragSource | null>(null);
  const [multiSelected, setMultiSelected] = useState<{
    source: DragSource;
    playerId: string;
  } | null>(null);

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

    if (dragging.source === toTeam) {
      onReorder(toTeam, dragging.playerId, toPlayerId);
    } else {
      // Team↔team or pool↔team: always swap so full sides stay full.
      onSwap(dragging.source, dragging.playerId, toTeam, toPlayerId);
    }

    resetDrag();
  }

  function handleDropOnTeam(toTeam: EditorTeam) {
    if (!dragging) {
      resetDrag();
      return;
    }
    if (dragging.source === 'pool') {
      onMoveToTeam(dragging.playerId, toTeam);
    } else if (dragging.source !== toTeam) {
      // Drop on empty area of team without target player: move only if space.
      onMoveToTeam(dragging.playerId, toTeam);
    }
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
              tab === 'swap'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
            onClick={() => onTabChange('swap')}
          >
            Quick swap
          </button>
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
            ? threeTeam
              ? 'Swap between A / B / C or with the rest of the squad. Tap two players to exchange them.'
              : 'Swap between Team A, Team B, or the rest of the squad. Tap two players to exchange them.'
            : tab === 'lock'
              ? threeTeam
                ? 'Name each team, place the players you want fixed, then Fill rest of teams to balance the remainder.'
                : 'Place the players you want fixed on each side, then Fill rest of teams to balance the remaining players.'
              : threeTeam
                ? 'Name each team and assign everyone with A / B / C or drag and drop. Drop onto a player to swap.'
                : 'Assign everyone yourself with the team arrows or drag and drop. Nothing is auto-filled.'}
        </p>
      </div>

      {showQuickSwap ? (
        <MultiTeamSwapPanel
          teams={[
            {
              key: 'a',
              name: teamAName ?? 'Team A',
              players: teamAPlayers,
              accent: 'border-b border-blue-100 bg-blue-50',
            },
            {
              key: 'b',
              name: teamBName ?? 'Team B',
              players: teamBPlayers,
              accent: 'border-b border-red-100 bg-red-50',
            },
            ...(threeTeam
              ? [
                  {
                    key: 'c' as EditorTeam,
                    name: teamCName ?? 'Team C',
                    players: teamCPlayers,
                    accent: 'border-b border-amber-100 bg-amber-50',
                  },
                ]
              : []),
          ]}
          poolPlayers={poolPlayers}
          selected={multiSelected}
          onSelect={(source, playerId) => setMultiSelected({ source, playerId })}
          onSwapPair={(from, fromId, to, toId) => {
            onSwap(from, fromId, to, toId);
            setMultiSelected(null);
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
