import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  getPositionLabel,
  getPositionsLabel,
  normalizePlayer,
  roundRating,
  type Player,
  type PlayerPosition,
} from '@shared/types';
import { Check, User } from 'lucide-react';
import { FutPlayerCard, FUT_CARD_APEX_PAD, FUT_CARD_HEIGHT, FUT_CARD_WIDTH } from './FutPlayerCard';

interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  selectable?: boolean;
  onToggle?: () => void;
  /** Squad rank by OVR when sort-by-rating is on, e.g. 5 of 26 */
  ratingRank?: number;
  ratingTotal?: number;
}

const POPUP_SCALE_DESKTOP = 1.8;
const POPUP_SCALE_MOBILE = 1.4;
const VIEWPORT_MARGIN = 12;
const MOBILE_MQ = '(max-width: 639px)';

function getPopupScale() {
  if (typeof window === 'undefined') return POPUP_SCALE_DESKTOP;
  return window.matchMedia(MOBILE_MQ).matches ? POPUP_SCALE_MOBILE : POPUP_SCALE_DESKTOP;
}

function scaledCardHeight(scale: number) {
  return (FUT_CARD_HEIGHT + FUT_CARD_APEX_PAD * 2) * scale;
}

type PopupPlacement = 'above' | 'below';

interface PopupCoords {
  left: number;
  top: number;
  placement: PopupPlacement;
}

function computePopupCoords(rect: DOMRect, scale: number): PopupCoords {
  const scaledW = FUT_CARD_WIDTH * scale;
  const scaledH = scaledCardHeight(scale);
  const gap = 10;
  const centerX = rect.left + rect.width / 2;

  const spaceAbove = rect.top - VIEWPORT_MARGIN;
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;

  let placement: PopupPlacement =
    spaceAbove >= scaledH + gap || spaceAbove >= spaceBelow ? 'above' : 'below';

  let top = placement === 'above' ? rect.top - gap : rect.bottom + gap;

  if (placement === 'above') {
    const minAnchorY = VIEWPORT_MARGIN + scaledH;
    if (top < minAnchorY) {
      if (spaceBelow >= scaledH + gap) {
        placement = 'below';
        top = rect.bottom + gap;
      } else {
        top = minAnchorY;
      }
    }
  }

  const halfW = scaledW / 2;
  let left = centerX;
  left = Math.max(VIEWPORT_MARGIN + halfW, left);
  left = Math.min(window.innerWidth - VIEWPORT_MARGIN - halfW, left);

  return { left, top, placement };
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

export function PlayerCard({
  player,
  selected = false,
  selectable,
  onToggle,
  ratingRank,
  ratingTotal,
}: PlayerCardProps) {
  const normalized = normalizePlayer(player);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const leaveTimerRef = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<PopupCoords | null>(null);
  const [popupScale, setPopupScale] = useState(POPUP_SCALE_DESKTOP);
  const tipId = useId();
  const hoverCapable = useRef(
    typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  );

  const updatePosition = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = getPopupScale();
    setPopupScale(scale);
    setCoords(computePopupCoords(rect, scale));
  }, []);

  const show = useCallback(() => {
    window.clearTimeout(leaveTimerRef.current);
    updatePosition();
    setOpen(true);
  }, [updatePosition]);

  const hide = useCallback(() => {
    if (hoverCapable.current) {
      leaveTimerRef.current = window.setTimeout(() => setOpen(false), 100);
      return;
    }
    setOpen(false);
  }, []);

  const cancelHide = useCallback(() => {
    window.clearTimeout(leaveTimerRef.current);
  }, []);

  const toggleTip = useCallback(() => {
    setOpen((prev) => {
      if (prev) return false;
      updatePosition();
      return true;
    });
  }, [updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, updatePosition]);

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

  const tipHandlers = {
    onMouseEnter: () => {
      if (hoverCapable.current) show();
    },
    onMouseLeave: () => {
      if (hoverCapable.current) hide();
    },
    onClick: (event: MouseEvent) => {
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
          ref={anchorRef}
          className="flex min-w-0 flex-1 cursor-default items-center gap-3 touch-manipulation"
          aria-describedby={open ? tipId : undefined}
          {...tipHandlers}
        >
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
            <p className="mt-1 text-sm font-display font-bold text-elite-600">
              {ratingRank != null && ratingTotal != null ? (
                <span className="mr-2 tabular-nums text-slate-500">
                  {ratingRank}/{ratingTotal}
                </span>
              ) : null}
              OVR {roundRating(normalized.ovr)}
            </p>
          </div>
        </div>
      </div>

      {open && coords
        ? createPortal(
            <div
              ref={tipRef}
              id={tipId}
              role="tooltip"
              className="pointer-events-auto fixed z-[9999] overflow-visible"
              style={{
                left: coords.left,
                top: coords.top,
                transform:
                  coords.placement === 'above'
                    ? `translate(-50%, -100%) scale(${popupScale})`
                    : `translate(-50%, 0) scale(${popupScale})`,
                transformOrigin:
                  coords.placement === 'above' ? 'bottom center' : 'top center',
              }}
              onMouseEnter={cancelHide}
              onMouseLeave={() => {
                if (hoverCapable.current) hide();
              }}
            >
              <FutPlayerCard player={normalized} size="sm" />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
