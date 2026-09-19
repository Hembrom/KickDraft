import { useMemo, useState } from 'react';
import { Repeat, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PitchPlayerMarker } from '@/components/PitchPlayerMarker';
import { PositionBadge } from '@/components/PlayerCard';
import {
  ROTATION_SLOT_LABELS,
  ROTATION_SLOTS,
  getRotationFormation,
  rotationSlotRoles,
  startersToRows,
  type RotationFormat,
} from '@shared/rotation-lineup';
import { getPitchSlotRole } from '@shared/pitch-formation';
import { roundRating, type Player, type RotationBoxes, type RotationSlot } from '@shared/types';

const DRAG_MIME = 'application/x-kickdraft-rotation';

function PlayerChip({
  player,
  status,
  selected,
  onDragStart,
  onClick,
}: {
  player: Player;
  status: 'playing' | 'sub';
  selected: boolean;
  onDragStart: (event: React.DragEvent) => void;
  onClick: (event: React.MouseEvent) => void;
}) {
  const playing = status === 'playing';
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        'flex cursor-grab items-center gap-2 rounded-xl border px-2 py-1.5 active:cursor-grabbing',
        playing
          ? 'border-emerald-400 bg-emerald-50'
          : 'border-slate-200 bg-slate-50',
        selected && (playing ? 'ring-2 ring-emerald-500' : 'border-amber-400 bg-amber-50'),
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
        {player.photoUrl ? (
          <img src={player.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <User className="h-4 w-4 text-slate-300" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-semibold text-slate-900">{player.name}</p>
          <span
            className={cn(
              'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
              playing ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600',
            )}
          >
            {playing ? 'On' : 'Sub'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {player.positions.map((position) => (
            <PositionBadge key={position} position={position} />
          ))}
          <span className="text-[10px] font-bold text-elite-600">{roundRating(player.ovr)}</span>
        </div>
      </div>
    </div>
  );
}

export function RotationLineupBoard({
  format,
  slots,
  boxes,
  selectedPlayerId,
  onSelectPlayer,
  onDropOnPitch,
  onDropOnBench,
}: {
  format: RotationFormat;
  slots: Array<Player | null>;
  boxes: RotationBoxes;
  selectedPlayerId: string | null;
  onSelectPlayer: (playerId: string | null) => void;
  onDropOnPitch: (playerId: string, index: number) => void;
  onDropOnBench: (playerId: string, slot: RotationSlot) => void;
}) {
  const roles = useMemo(() => rotationSlotRoles(format), [format]);
  const rows = useMemo(() => startersToRows(slots, format), [slots, format]);
  const formation = getRotationFormation(format);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  function readDragId(event: React.DragEvent): string | null {
    const raw = event.dataTransfer.getData(DRAG_MIME) || event.dataTransfer.getData('text/plain');
    return raw || null;
  }

  function startDrag(playerId: string) {
    return (event: React.DragEvent) => {
      event.dataTransfer.setData(DRAG_MIME, playerId);
      event.dataTransfer.setData('text/plain', playerId);
      event.dataTransfer.effectAllowed = 'move';
    };
  }

  const rowCount = formation.length;
  const pitchHeight = Math.max(420, 80 + rowCount * 110);

  return (
    <div className="space-y-4">
      <div
        className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl"
        style={{
          height: pitchHeight,
          background: `linear-gradient(180deg,
            rgba(34,120,60,0.95) 0%,
            rgba(42,138,72,0.98) 100%)`,
        }}
      >
        <div className="pointer-events-none absolute inset-2 rounded-lg border-2 border-white/50" />
        <div className="pointer-events-none absolute top-2 right-3 left-3 h-0.5 bg-white/50" />
        <div className="pointer-events-none absolute bottom-2 right-3 left-3 h-0.5 bg-white/50" />
        <div className="pointer-events-none absolute top-1/2 right-3 left-3 h-0.5 -translate-y-1/2 bg-white/40" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50" />
        <div className="pointer-events-none absolute bottom-2 left-1/2 h-10 w-20 -translate-x-1/2 border-2 border-b-0 border-white/40" />

        <p className="pointer-events-none absolute left-3 top-3 rounded-full bg-blue-600/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Starting {format}
        </p>

        <div className="relative flex h-full flex-col justify-evenly px-2 py-8">
          {rows.map((row, rowIndex) => {
            const role = getPitchSlotRole(rowIndex, rowCount);
            const startIndex = formation.slice(0, rowIndex).reduce((sum, n) => sum + n, 0);

            return (
              <div key={`row-${rowIndex}`} className="flex items-end justify-evenly gap-1">
                {row.map((player, colIndex) => {
                  const index = startIndex + colIndex;
                  const key = `pitch-${index}`;
                  const selectedHere = Boolean(player && selectedPlayerId === player.id);

                  return (
                    <button
                      key={key}
                      type="button"
                      draggable={Boolean(player)}
                      onDragStart={player ? startDrag(player.id) : undefined}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                        setDragOverKey(key);
                      }}
                      onDragLeave={() =>
                        setDragOverKey((current) => (current === key ? null : current))
                      }
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragOverKey(null);
                        const playerId = readDragId(event);
                        if (playerId) onDropOnPitch(playerId, index);
                      }}
                      onClick={() => {
                        if (selectedPlayerId && selectedPlayerId !== player?.id) {
                          onDropOnPitch(selectedPlayerId, index);
                          return;
                        }
                        onSelectPlayer(selectedHere ? null : player?.id ?? null);
                      }}
                      className={cn(
                        'flex min-h-[72px] min-w-[64px] flex-col items-center justify-end rounded-xl p-1',
                        dragOverKey === key && 'bg-white/20 ring-2 ring-white',
                        selectedHere && 'bg-white/15 ring-2 ring-amber-300',
                      )}
                    >
                      {player ? (
                        <PitchPlayerMarker player={player} pitchRole={roles[index]} compact />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-white/70 text-[10px] font-bold text-white/90">
                          {role}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Each box lists that position: <span className="font-semibold text-emerald-700">green = on
        the pitch</span>, grey = sub. Drag or tap to swap.
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ROTATION_SLOTS.map((slot) => {
          const playing = slots.filter(
            (player, index): player is Player => Boolean(player) && roles[index] === slot,
          );
          const subs = boxes[slot];
          const boxKey = `bench-${slot}`;
          const empty = playing.length === 0 && subs.length === 0;

          return (
            <section
              key={slot}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDragOverKey(boxKey);
              }}
              onDragLeave={() =>
                setDragOverKey((current) => (current === boxKey ? null : current))
              }
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragOverKey(null);
                const playerId = readDragId(event);
                if (playerId) onDropOnBench(playerId, slot);
              }}
              onClick={() => {
                if (selectedPlayerId) onDropOnBench(selectedPlayerId, slot);
              }}
              className={cn(
                'min-h-[140px] rounded-2xl border bg-white p-2 transition',
                dragOverKey === boxKey
                  ? 'border-elite-400 ring-2 ring-elite-100'
                  : 'border-slate-200',
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-1">
                <h3 className="flex items-center gap-1 font-display text-sm font-bold text-slate-900">
                  <Repeat className="h-3.5 w-3.5 text-elite-600" />
                  {ROTATION_SLOT_LABELS[slot]}
                </h3>
                <span className="text-[11px] text-slate-500">
                  <span className="font-semibold text-emerald-700">{playing.length}</span>
                  {' on · '}
                  {subs.length} sub
                </span>
              </div>
              {empty ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-2 py-6 text-center text-xs text-slate-400">
                  No one in this position yet
                </p>
              ) : (
                <div className="space-y-1.5">
                  {playing.map((player) => (
                    <PlayerChip
                      key={`on-${player.id}`}
                      player={player}
                      status="playing"
                      selected={selectedPlayerId === player.id}
                      onDragStart={startDrag(player.id)}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (selectedPlayerId && selectedPlayerId !== player.id) {
                          const index = slots.findIndex((slotPlayer) => slotPlayer?.id === player.id);
                          if (index >= 0) onDropOnPitch(selectedPlayerId, index);
                          return;
                        }
                        onSelectPlayer(selectedPlayerId === player.id ? null : player.id);
                      }}
                    />
                  ))}
                  {subs.map((player) => (
                    <PlayerChip
                      key={`sub-${player.id}`}
                      player={player}
                      status="sub"
                      selected={selectedPlayerId === player.id}
                      onDragStart={startDrag(player.id)}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (selectedPlayerId && selectedPlayerId !== player.id) {
                          onDropOnBench(selectedPlayerId, slot);
                          return;
                        }
                        onSelectPlayer(selectedPlayerId === player.id ? null : player.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
