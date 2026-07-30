import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  getPositionLabel,
  getPositionsLabel,
  normalizePlayer,
  roundRating,
  STAT_KEYS,
  type Player,
  type PlayerPosition,
} from '@shared/types';
import { Check, User } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  selectable?: boolean;
  onToggle?: () => void;
}

const STAT_LABELS: Record<(typeof STAT_KEYS)[number], string> = {
  pace: 'PAC',
  shooting: 'SHO',
  passing: 'PAS',
  dribbling: 'DRI',
  defending: 'DEF',
  physicality: 'PHY',
  stamina: 'STA',
};

const TIP_WIDTH = 224;
const TIP_GAP = 8;
const VIEW_PAD = 8;

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

function AttributesPopover({
  player,
  open,
  top,
  left,
  id,
  tipRef,
}: {
  player: Player;
  open: boolean;
  top: number;
  left: number;
  id: string;
  tipRef: RefObject<HTMLDivElement | null>;
}) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={tipRef}
      id={id}
      className="pointer-events-none fixed z-[9999] w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
      style={{ top, left }}
      role="tooltip"
    >
      <p className="mb-2 truncate text-center text-xs font-semibold text-slate-700">{player.name}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {STAT_KEYS.map((key) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="font-semibold tracking-wide text-slate-500">{STAT_LABELS[key]}</span>
            <span className="tabular-nums font-bold text-slate-900">{roundRating(player[key])}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 border-t border-slate-100 pt-2 text-center text-sm font-display font-bold text-elite-600">
        OVR {roundRating(player.ovr)}
      </p>
    </div>,
    document.body,
  );
}

export function PlayerCard({ player, selected = false, selectable, onToggle }: PlayerCardProps) {
  const normalized = normalizePlayer(player);
  const anchorRef = useRef<HTMLElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tipId = useId();
  const hoverCapable = useRef(
    typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  );

  function updatePosition() {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tipH = tipRef.current?.offsetHeight ?? 200;
    const tipW = tipRef.current?.offsetWidth ?? TIP_WIDTH;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < tipH + TIP_GAP && rect.top > tipH + TIP_GAP
        ? rect.top - tipH - TIP_GAP
        : rect.bottom + TIP_GAP;
    const centered = rect.left + rect.width / 2 - tipW / 2;
    const left = Math.min(
      window.innerWidth - tipW - VIEW_PAD,
      Math.max(VIEW_PAD, centered),
    );
    setPos({ top, left });
  }

  function show() {
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  function toggleTip() {
    setOpen((prev) => !prev);
  }

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  // Close tap-tooltip when tapping elsewhere (mobile / coarse pointer).
  useEffect(() => {
    if (!open || hoverCapable.current) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (tipRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const photoAndInfo = (
    <>
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-elite-50 ring-1 ring-slate-200 sm:h-16 sm:w-16">
        {player.photoUrl ? (
          <img src={normalized.photoUrl!} alt="" className="h-full w-full object-cover" />
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

  const tipHandlers = {
    onMouseEnter: () => {
      if (hoverCapable.current) show();
    },
    onMouseLeave: () => {
      if (hoverCapable.current) hide();
    },
    onClick: (event: MouseEvent) => {
      // Touch / coarse pointers: tap card body to toggle stats (not selection).
      if (!hoverCapable.current) {
        event.preventDefault();
        toggleTip();
      }
    },
  };

  const shellClass = cn(
    'card relative flex w-full items-center gap-3 p-3.5 text-left transition sm:p-3',
    selectable &&
      (selected
        ? 'border-elite-400 bg-elite-50/90 shadow-elite ring-1 ring-elite-200'
        : 'hover:border-elite-200 hover:bg-elite-50/40'),
  );

  return (
    <>
      <div className={shellClass}>
        {selectable ? (
          <button
            type="button"
            className="touch-manipulation shrink-0 rounded-md p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-elite-500"
            onClick={(event) => {
              event.stopPropagation();
              onToggle?.();
            }}
            aria-pressed={selected}
            aria-label={`${selected ? 'Deselect' : 'Select'} ${normalized.name}`}
          >
            <SelectionCheckbox selected={selected} />
          </button>
        ) : null}

        <div
          ref={(node) => {
            anchorRef.current = node;
          }}
          className="flex min-w-0 flex-1 cursor-default items-center gap-3 touch-manipulation"
          aria-describedby={open ? tipId : undefined}
          {...tipHandlers}
        >
          {photoAndInfo}
        </div>
      </div>
      <AttributesPopover
        id={tipId}
        tipRef={tipRef}
        player={normalized}
        open={open}
        top={pos.top}
        left={pos.left}
      />
    </>
  );
}
