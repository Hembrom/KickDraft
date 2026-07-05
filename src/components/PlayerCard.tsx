import { cn } from '@/lib/utils';
import { getPositionLabel, getPositionsLabel, normalizePlayer, roundRating, type Player, type PlayerPosition } from '@shared/types';
import { Check, User } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  selectable?: boolean;
  onToggle?: () => void;
}

export function PositionBadge({
  position,
  className,
}: {
  position: PlayerPosition;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-md bg-elite-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-elite-700',
        className,
      )}
      title={getPositionLabel(position)}
    >
      {position}
    </span>
  );
}

function SelectionCheckbox({ selected }: { selected: boolean }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md border-2 transition',
        'h-7 w-7 sm:h-6 sm:w-6',
        selected
          ? 'border-elite-600 bg-elite-600 text-white shadow-sm'
          : 'border-slate-400 bg-white text-transparent',
      )}
      aria-hidden
    >
      <Check className={cn('h-4 w-4 sm:h-3.5 sm:w-3.5', selected ? 'opacity-100' : 'opacity-0')} strokeWidth={3} />
    </div>
  );
}

export function PlayerCard({ player, selected = false, selectable, onToggle }: PlayerCardProps) {
  const normalized = normalizePlayer(player);

  const body = (
    <>
      {selectable ? <SelectionCheckbox selected={selected} /> : null}

      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-elite-50 ring-1 ring-slate-200 sm:h-16 sm:w-16">
        {player.photoUrl ? (
          <img src={normalized.photoUrl!} alt={normalized.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <User className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="truncate font-semibold text-slate-900">{normalized.name}</h3>
          {normalized.positions.map((position) => (
            <PositionBadge key={position} position={position} />
          ))}
          {normalized.clubLogoUrl ? (
            <img
              src={normalized.clubLogoUrl}
              alt={normalized.favouriteClub}
              className="h-4 w-4 object-contain"
            />
          ) : null}
        </div>
        <p className="truncate text-xs text-slate-500">
          {getPositionsLabel(normalized.positions)}
          {normalized.favouriteClub ? ` · ${normalized.favouriteClub}` : ''}
        </p>
        <p className="mt-1 text-sm font-display font-bold text-elite-600">OVR {roundRating(normalized.ovr)}</p>
      </div>
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={`${selected ? 'Deselect' : 'Select'} ${normalized.name}`}
        className={cn(
          'card flex w-full touch-manipulation items-center gap-3 p-3.5 text-left transition sm:p-3',
          selected
            ? 'border-elite-400 bg-elite-50/90 shadow-elite ring-1 ring-elite-200'
            : 'hover:border-elite-200 hover:bg-elite-50/40 active:bg-elite-50/60',
        )}
      >
        {body}
      </button>
    );
  }

  return <div className="card flex items-center gap-3 p-3">{body}</div>;
}
