import { cn } from '@/lib/utils';
import { getPitchDisplayPosition } from '@shared/match-utils';
import { normalizePlayer, roundRating, type Player, type PlayerPosition, type PlayerStats } from '@shared/types';
import { User } from 'lucide-react';

export const FUT_CARD_WIDTH = 124;
export const FUT_CARD_HEIGHT = 218;
/** Room above/below the shield so the chevron tips aren't clipped. */
export const FUT_CARD_APEX_PAD = 8;

interface FutPlayerCardProps {
  player: Player;
  className?: string;
  size?: 'sm' | 'md';
  pitchRole?: PlayerPosition;
}

const LEFT_STATS: { key: keyof PlayerStats; label: string }[] = [
  { key: 'pace', label: 'PAC' },
  { key: 'shooting', label: 'SHO' },
  { key: 'passing', label: 'PAS' },
];

const RIGHT_STATS: { key: keyof PlayerStats; label: string }[] = [
  { key: 'dribbling', label: 'DRI' },
  { key: 'defending', label: 'DEF' },
  { key: 'physicality', label: 'PHY' },
];

/** Chevron depth matches top and bottom (14% of shield height). */
const CHEVRON_DEPTH = 0.14;
const BOTTOM_SHOULDER = 0.77;
const BOTTOM_POINT = 0.91;

const SHIELD_CLIP = `polygon(50% 0%, 100% ${CHEVRON_DEPTH * 100}%, 100% ${BOTTOM_SHOULDER * 100}%, 50% ${BOTTOM_POINT * 100}%, 0% ${BOTTOM_SHOULDER * 100}%, 0% ${CHEVRON_DEPTH * 100}%)`;

const GOLD_FRAME = `
  linear-gradient(145deg, #fff0a8 0%, #e8c547 22%, #c99818 48%, #f3dd78 72%, #a67c00 100%)
`;

const GOLD_INNER = `
  linear-gradient(160deg, #f7e89a 0%, #e0b832 45%, #c99818 100%)
`;

function displayName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0]).toUpperCase();
}

function shieldPath(w: number, h: number, inset = 0) {
  const topY = h * CHEVRON_DEPTH + inset * 0.55;
  const bottomShoulderY = h * BOTTOM_SHOULDER - inset * 0.45;
  const bottomPointY = h * BOTTOM_POINT - inset * 0.85;
  const side = inset;
  return `M ${w / 2} 0 L ${w - side} ${topY} L ${w - side} ${bottomShoulderY} L ${w / 2} ${bottomPointY} L ${side} ${bottomShoulderY} L ${side} ${topY} Z`;
}

function CardBorderOverlay({ compact }: { compact: boolean }) {
  const w = compact ? FUT_CARD_WIDTH : 148;
  const h = compact ? FUT_CARD_HEIGHT : 262;
  const outer = shieldPath(w, h, 0);
  const inner = shieldPath(w, h, compact ? 3.5 : 4);

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={outer} fill="none" stroke="#120e06" strokeWidth={compact ? 3.5 : 4} vectorEffect="non-scaling-stroke" />
      <path d={outer} fill="none" stroke="#f5e08a" strokeWidth={compact ? 1.4 : 1.6} vectorEffect="non-scaling-stroke" />
      <path
        d={inner}
        fill="none"
        stroke="#3d2f0a"
        strokeWidth={compact ? 1 : 1.2}
        vectorEffect="non-scaling-stroke"
        opacity={0.9}
      />
    </svg>
  );
}

function StatColumn({
  stats,
  player,
  compact,
  align,
}: {
  stats: { key: keyof PlayerStats; label: string }[];
  player: Player;
  compact: boolean;
  align: 'left' | 'right';
}) {
  return (
    <div
      className={cn(
        'flex flex-col',
        compact ? 'gap-[2px]' : 'gap-[3px]',
        align === 'right' && 'items-end text-right',
      )}
    >
      {stats.map(({ key, label }) => (
        <div
          key={key}
          className={cn(
            'flex items-baseline gap-1 leading-none text-[#2f2410]',
            compact ? 'text-[9px]' : 'text-[10px]',
          )}
        >
          <span className="min-w-[16px] font-bold tabular-nums">{roundRating(player[key])}</span>
          <span className="font-semibold tracking-wide">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function FutPlayerCard({ player, className, size = 'sm', pitchRole }: FutPlayerCardProps) {
  const p = normalizePlayer(player);
  const position = pitchRole
    ? getPitchDisplayPosition(p, pitchRole)
    : p.positions.includes('GK')
      ? 'GK'
      : (p.positions[0] ?? 'MID');
  const compact = size === 'sm';
  const frameInset = compact ? 6 : 7;
  const bodyHeight = compact ? FUT_CARD_HEIGHT : 262;
  const bodyWidth = compact ? FUT_CARD_WIDTH : 148;
  const pad = FUT_CARD_APEX_PAD;

  return (
    <article
      className={cn('relative shrink-0 select-none overflow-visible', className)}
      style={{
        width: bodyWidth,
        height: bodyHeight + pad * 2,
        paddingTop: pad,
        paddingBottom: pad,
      }}
      title={p.name}
    >
      <div
        className="relative w-full overflow-visible drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
        style={{ height: bodyHeight, clipPath: SHIELD_CLIP }}
      >
        <div className="absolute inset-0" style={{ background: GOLD_FRAME }} />

        <div
          className="absolute"
          style={{
            inset: frameInset - 1,
            background: GOLD_INNER,
          }}
        />

        <div
          className="absolute overflow-hidden"
          style={{ inset: frameInset }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `
                repeating-linear-gradient(
                  -52deg,
                  transparent 0px,
                  transparent 4px,
                  rgba(255,255,255,0.08) 4px,
                  rgba(255,255,255,0.08) 5px
                ),
                linear-gradient(
                  165deg,
                  #faf6eb 0%,
                  #f5edd4 20%,
                  #edd56a 45%,
                  #f7e89a 65%,
                  #e8c547 100%
                )
              `,
            }}
          />

          <div
            className={cn(
              'relative flex h-full flex-col',
              compact ? 'px-2.5 pb-5 pt-[20px]' : 'px-3 pb-5 pt-6',
            )}
          >
            <div
              className={cn(
                'relative flex shrink-0 items-start gap-1',
                compact ? 'h-[58px]' : 'h-[70px]',
              )}
            >
              <div
                className={cn(
                  'relative z-10 shrink-0 leading-none text-[#2f2410]',
                  compact ? 'w-[38px]' : 'w-[44px]',
                )}
              >
                <p className={cn('font-bold tabular-nums tracking-tight', compact ? 'text-[24px]' : 'text-[30px]')}>
                  {roundRating(p.ovr)}
                </p>
                <p className={cn('mt-0.5 font-bold tracking-wider', compact ? 'text-[9px]' : 'text-[10px]')}>
                  {position}
                </p>
                {p.clubLogoUrl ? (
                  <img
                    src={p.clubLogoUrl}
                    alt=""
                    className={cn('mt-0.5 object-contain', compact ? 'h-[16px] w-[16px]' : 'h-[18px] w-[18px]')}
                  />
                ) : (
                  <div
                    className={cn(
                      'mt-0.5 rounded-full bg-[#2f2410]/10',
                      compact ? 'h-[16px] w-[16px]' : 'h-[18px] w-[18px]',
                    )}
                  />
                )}
              </div>

              <div className="relative min-w-0 flex-1 self-stretch overflow-hidden">
                {p.photoUrl ? (
                  <img
                    src={p.photoUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full items-end justify-center pb-1 text-[#2f2410]/25">
                    <User className={compact ? 'h-10 w-10' : 'h-12 w-12'} strokeWidth={1.25} />
                  </div>
                )}
              </div>
            </div>

            <p
              className={cn(
                'shrink-0 truncate border-t border-[#5c4a14]/50 pt-1 text-center font-bold uppercase tracking-[0.1em] text-[#2f2410]',
                compact ? 'text-[9px]' : 'text-[10px]',
              )}
            >
              {displayName(p.name)}
            </p>

            <div className={cn('mt-1 flex shrink-0 flex-col', compact ? 'gap-[2px]' : 'gap-[3px]')}>
              <div
                className={cn(
                  'flex items-start justify-between',
                  compact ? 'gap-2 pl-0.5 pr-2' : 'gap-2.5 pl-0.5 pr-2.5',
                )}
              >
                <StatColumn stats={LEFT_STATS} player={p} compact={compact} align="left" />
                <div className="w-px self-stretch bg-[#5c4a14]/45" />
                <StatColumn stats={RIGHT_STATS} player={p} compact={compact} align="right" />
              </div>
              <div
                className={cn(
                  'flex items-baseline justify-center gap-1 leading-none text-[#2f2410]',
                  compact ? 'text-[9px]' : 'text-[10px]',
                )}
              >
                <span className="font-bold tabular-nums">{roundRating(p.stamina)}</span>
                <span className="font-semibold tracking-wide">STA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-0 right-0" style={{ top: pad, height: bodyHeight }}>
        <CardBorderOverlay compact={compact} />
      </div>
    </article>
  );
}
