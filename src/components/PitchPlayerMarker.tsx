import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { normalizePlayer, type Player, type PlayerPosition } from '@shared/types';
import { User } from 'lucide-react';
import { FutPlayerCard, FUT_CARD_HEIGHT, FUT_CARD_WIDTH } from './FutPlayerCard';
const POPUP_SCALE = 1.8;
const VIEWPORT_MARGIN = 12;

function displayName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const raw = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return raw.toUpperCase();
}

type PopupPlacement = 'above' | 'below';

interface PopupCoords {
  left: number;
  top: number;
  placement: PopupPlacement;
}

function computePopupCoords(rect: DOMRect): PopupCoords {
  const scaledW = FUT_CARD_WIDTH * POPUP_SCALE;
  const scaledH = FUT_CARD_HEIGHT * POPUP_SCALE;
  const gap = 10;
  const centerX = rect.left + rect.width / 2;

  const spaceAbove = rect.top - VIEWPORT_MARGIN;
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;

  const placement: PopupPlacement =
    spaceAbove >= scaledH + gap || spaceAbove >= spaceBelow ? 'above' : 'below';

  const top =
    placement === 'above' ? rect.top - gap : rect.bottom + gap;

  const halfW = scaledW / 2;
  let left = centerX;
  left = Math.max(VIEWPORT_MARGIN + halfW, left);
  left = Math.min(window.innerWidth - VIEWPORT_MARGIN - halfW, left);

  return { left, top, placement };
}

export function PitchPlayerMarker({
  player,
  pitchRole,
  className,
}: {
  player: Player;
  pitchRole?: PlayerPosition;
  className?: string;
}) {
  const p = normalizePlayer(player);
  const markerRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<PopupCoords | null>(null);

  const updatePosition = useCallback(() => {
    const rect = markerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords(computePopupCoords(rect));
  }, []);

  const showPopup = useCallback(() => {
    window.clearTimeout(leaveTimerRef.current);
    updatePosition();
    setOpen(true);
  }, [updatePosition]);

  const hidePopup = useCallback(() => {
    leaveTimerRef.current = window.setTimeout(() => setOpen(false), 100);
  }, []);

  const cancelHide = useCallback(() => {
    window.clearTimeout(leaveTimerRef.current);
  }, []);

  return (
    <>
      <div
        ref={markerRef}
        className={cn(
          'relative z-10 flex w-[76px] flex-col items-center',
          open && 'z-50',
          className,
        )}
        onMouseEnter={showPopup}
        onMouseLeave={hidePopup}
        onFocus={showPopup}
        onBlur={hidePopup}
      >
        <div className="relative h-[52px] w-[52px] overflow-hidden rounded-full border-2 border-white/90 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.35)] ring-1 ring-black/10 sm:h-14 sm:w-14">
          {p.photoUrl ? (
            <img src={p.photoUrl} alt="" className="h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
              <User className="h-6 w-6" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <p className="mt-1.5 max-w-[88px] truncate text-center text-[9px] font-bold uppercase tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:text-[10px]">
          {displayName(p.name)}
        </p>
      </div>

      {open && coords
        ? createPortal(
            <div
              className="pointer-events-auto fixed z-[9999]"
              style={{
                left: coords.left,
                top: coords.top,
                transform:
                  coords.placement === 'above'
                    ? `translate(-50%, -100%) scale(${POPUP_SCALE})`
                    : `translate(-50%, 0) scale(${POPUP_SCALE})`,
                transformOrigin:
                  coords.placement === 'above' ? 'bottom center' : 'top center',
              }}
              onMouseEnter={cancelHide}
              onMouseLeave={hidePopup}
            >
              <FutPlayerCard player={player} pitchRole={pitchRole} size="sm" />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
