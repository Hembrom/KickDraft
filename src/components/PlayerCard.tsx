import { cn } from '@/lib/utils';
import { getPositionLabel, getPositionsLabel, normalizePlayer, roundRating, type Player, type PlayerPosition } from '@shared/types';
import { User } from 'lucide-react';

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

export function PlayerCard({ player, selected, selectable, onToggle }: PlayerCardProps) {
  const normalized = normalizePlayer(player);
  const content = (
    <>
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-elite-50 ring-1 ring-slate-200">
        {player.photoUrl ? (
          <img src={normalized.photoUrl!} alt={normalized.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <User className="h-7 w-7" />
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

      {selectable ? (
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold',
            selected
              ? 'border-elite-500 bg-elite-600 text-white'
              : 'border-slate-300 bg-white text-transparent',
          )}
        >
          {selected ? '✓' : ''}
        </div>
      ) : null}
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'card flex w-full items-center gap-3 p-3 text-left transition',
          selected
            ? 'border-elite-300 bg-elite-50/80 shadow-elite'
            : 'hover:border-elite-200 hover:bg-elite-50/40',
        )}
      >
        {content}
      </button>
    );
  }

  return <div className="card flex items-center gap-3 p-3">{content}</div>;
}
