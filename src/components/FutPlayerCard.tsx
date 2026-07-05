import { cn } from '@/lib/utils';
import { getPitchDisplayPosition } from '@shared/match-utils';
import { normalizePlayer, roundRating, type Player, type PlayerPosition, type PlayerStats } from '@shared/types';
import { User } from 'lucide-react';

export const FUT_CARD_WIDTH = 124;
export const FUT_CARD_HEIGHT = 196;

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

const SHIELD_CLIP =
  'polygon(50% 0%, 100% 6%, 100% 77%, 50% 91%, 0% 77%, 0% 6%)';

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

function CardBorderOverlay({ compact }: { compact: boolean }) {
  const w = compact ? 124 : 148;
  const h = compact ? 196 : 236;
  const path = `M ${w / 2} 0 L ${w} ${h * 0.06} L ${w} ${h * 0.77} L ${w / 2} ${h * 0.91} L 0 ${h * 0.77} L 0 ${h * 0.06} Z`;
  const inset = compact ? 4 : 5;
  const innerPath = `M ${w / 2} ${inset * 0.15} L ${w - inset} ${h * 0.06 + inset * 0.25} L ${w - inset} ${h * 0.77 - inset * 0.5} L ${w / 2} ${h * 0.91 - inset} L ${inset} ${h * 0.77 - inset * 0.5} L ${inset} ${h * 0.06 + inset * 0.25} Z`;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={path} fill="none" stroke="#120e06" strokeWidth={compact ? 4 : 4.5} strokeLinejoin="round" />
      <path d={path} fill="none" stroke="#f5e08a" strokeWidth={compact ? 1.8 : 2} strokeLinejoin="round" />
      <path
        d={innerPath}
        fill="none"
        stroke="#3d2f0a"
        strokeWidth={compact ? 1.2 : 1.4}
        strokeLinejoin="round"
        opacity={0.85}
      />
    </svg>
  );
}

function StatColumn({
  stats,
  player,
  compact,
}: {
  stats: { key: keyof PlayerStats; label: string }[];
  player: Player;
  compact: boolean;
}) {
  return (
    <div className={cn('flex flex-col', compact ? 'gap-[2px]' : 'gap-[3px]')}>
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
  const frameInset = compact ? 5 : 6;
  const ringInset = compact ? 2.5 : 3;

  return (
    <article
      className={cn(
        'relative shrink-0 select-none',
        compact ? 'h-[196px] w-[124px]' : 'h-[236px] w-[148px]',
        className,
      )}
      title={p.name}
    >
      <div
        className="relative h-full w-full overflow-hidden drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
        style={{ clipPath: SHIELD_CLIP }}
      >
        <div className="absolute inset-0" style={{ background: GOLD_FRAME }} />

        <div
          className="absolute"
          style={{ inset: ringInset, background: '#1a1206' }}
        />

        <div
          className="absolute"
          style={{
            inset: frameInset,
            background: GOLD_INNER,
          }}
        />

        <div
          className="absolute overflow-hidden"
          style={{ inset: frameInset + 1.5 }}
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
              compact ? 'px-2.5 pb-5 pt-4' : 'px-3 pb-5 pt-5',
            )}
          >
            <div className={cn('relative shrink-0', compact ? 'h-[58px]' : 'h-[72px]')}>
              <div className={cn('relative z-10 leading-none text-[#2f2410]', compact ? 'w-[36px]' : 'w-[42px]')}>
                <p className={cn('font-bold tabular-nums tracking-tight', compact ? 'text-[26px]' : 'text-[32px]')}>
                  {roundRating(p.ovr)}
                </p>
                <p className={cn('mt-0.5 font-bold tracking-wider', compact ? 'text-[10px]' : 'text-[11px]')}>
                  {position}
                </p>
                {p.clubLogoUrl ? (
                  <img
                    src={p.clubLogoUrl}
                    alt=""
                    className={cn('mt-1 object-contain', compact ? 'h-[18px] w-[18px]' : 'h-[20px] w-[20px]')}
                  />
                ) : (
                  <div
                    className={cn(
                      'mt-1 rounded-full bg-[#2f2410]/10',
                      compact ? 'h-[18px] w-[18px]' : 'h-[20px] w-[20px]',
                    )}
                  />
                )}
              </div>

              <div
                className={cn(
                  'absolute bottom-0 right-0 overflow-hidden',
                  compact ? 'left-[30px] top-1' : 'left-[36px] top-1.5',
                )}
              >
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt="" className="h-full w-full object-cover object-top" />
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

            <div
              className={cn(
                'mt-1 grid shrink-0 grid-cols-[1fr_auto_1fr] items-start px-1',
                compact ? 'gap-x-2' : 'gap-x-2.5',
              )}
            >
              <StatColumn stats={LEFT_STATS} player={p} compact={compact} />
              <div className="w-px self-stretch bg-[#5c4a14]/45" />
              <StatColumn stats={RIGHT_STATS} player={p} compact={compact} />
            </div>
          </div>
        </div>
      </div>

      <CardBorderOverlay compact={compact} />
    </article>
  );
}
