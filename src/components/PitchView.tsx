import { formatRatingGap, getMatchSizeLabel, roundRating } from '@shared/types';
import { enrichMatchWithRoster } from '@shared/match-utils';
import { assignPitchRows, getFormationLabel, getPitchSlotRole } from '@shared/pitch-formation';
import type { GeneratedTeam, MatchRecord, Player } from '@shared/types';
import { cn } from '@/lib/utils';
import { PitchPlayerMarker } from './PitchPlayerMarker';

type PitchLayout = 'horizontal' | 'vertical';
type TeamSide = 'left' | 'right' | 'top' | 'bottom';

function TeamHalf({
  team,
  teamSize,
  side,
  layout,
}: {
  team: GeneratedTeam;
  teamSize: number;
  side: TeamSide;
  layout: PitchLayout;
}) {
  const rows = assignPitchRows(team.players, teamSize);
  const rowCount = rows.length;

  const isFirstTeam = side === 'left' || side === 'top';
  const teamColor = isFirstTeam ? 'bg-blue-600/80' : 'bg-red-600/80';

  if (layout === 'vertical') {
    const displayRows = side === 'top' ? rows : [...rows].reverse();

    return (
      <div className="relative flex flex-1 flex-col px-3 py-4 sm:px-4">
        <div
          className={cn(
            'pointer-events-none absolute flex flex-col gap-0.5',
            side === 'top' ? 'left-3 top-2 items-start' : 'bottom-2 left-3 items-start',
          )}
        >
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90',
              teamColor,
            )}
          >
            {team.name}
          </span>
          <span className="text-[10px] font-medium text-white/70">
            OVR {roundRating(team.averageRating)}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-stretch justify-around gap-2 pt-6">
          {displayRows.map((row, rowIndex) => {
            const roleIndex = side === 'top' ? rowIndex : rowCount - 1 - rowIndex;
            const slotRole = getPitchSlotRole(roleIndex, rowCount);

            return (
              <div
                key={`${side}-row-${rowIndex}`}
                className="flex flex-row items-center justify-around gap-2 px-1"
              >
                {row.map((player) => (
                  <PitchPlayerMarker key={player.id} player={player} pitchRole={slotRole} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const columns = side === 'left' ? rows : [...rows].reverse();

  return (
    <div
      className={cn(
        'relative flex flex-1 flex-row items-stretch justify-around px-2 py-8 sm:px-4 sm:py-10',
        side === 'left' ? 'pr-3' : 'pl-3',
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute top-2 flex flex-col gap-0.5 sm:top-3',
          side === 'left' ? 'left-3 items-start sm:left-4' : 'right-3 items-end sm:right-4',
        )}
      >
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90 sm:text-xs',
            teamColor,
          )}
        >
          {team.name}
        </span>
        <span className="text-[10px] font-medium text-white/70 sm:text-xs">
          OVR {roundRating(team.averageRating)}
        </span>
      </div>

      <div className="flex flex-1 flex-row items-center justify-around gap-2 sm:gap-4 md:gap-6">
        {columns.map((column, colIndex) => {
          const rowIndex = side === 'left' ? colIndex : rowCount - 1 - colIndex;
          const slotRole = getPitchSlotRole(rowIndex, rowCount);

          return (
            <div
              key={`${side}-col-${colIndex}`}
              className="flex flex-col items-center justify-center gap-3 sm:gap-4"
            >
              {column.map((player) => (
                <PitchPlayerMarker key={player.id} player={player} pitchRole={slotRole} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PitchField({
  layout,
  teamA,
  teamB,
  teamASize,
  teamBSize,
}: {
  layout: PitchLayout;
  teamA: GeneratedTeam;
  teamB: GeneratedTeam;
  teamASize: number;
  teamBSize: number;
}) {
  const isVertical = layout === 'vertical';

  return (
    <div
      className={cn(
        'relative mx-auto w-full overflow-visible',
        isVertical
          ? 'flex min-h-[480px] max-w-lg flex-col aspect-[3/4]'
          : 'min-h-[280px] min-w-[920px] max-w-7xl aspect-[2/1]',
      )}
      style={{
        background: isVertical
          ? `linear-gradient(180deg,
              rgba(34,120,60,0.95) 0%,
              rgba(42,138,72,0.98) 48%,
              rgba(42,138,72,0.98) 52%,
              rgba(34,120,60,0.95) 100%
            )`
          : `linear-gradient(90deg,
              rgba(34,120,60,0.95) 0%,
              rgba(42,138,72,0.98) 48%,
              rgba(42,138,72,0.98) 52%,
              rgba(34,120,60,0.95) 100%
            )`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              ${isVertical ? '0deg' : '90deg'},
              transparent,
              transparent 40px,
              rgba(255,255,255,0.03) 40px,
              rgba(255,255,255,0.03) 80px
            ),
            repeating-linear-gradient(
              ${isVertical ? '90deg' : '0deg'},
              transparent,
              transparent 40px,
              rgba(0,0,0,0.04) 40px,
              rgba(0,0,0,0.04) 80px
            )
          `,
        }}
      />

      <div className="pointer-events-none absolute inset-3 rounded-lg border-2 border-white/50 sm:inset-4" />

      {isVertical ? (
        <>
          <div className="pointer-events-none absolute top-3 right-4 left-4 h-0.5 bg-white/50" />
          <div className="pointer-events-none absolute top-1/2 right-4 left-4 h-0.5 -translate-y-1/2 bg-white/50" />
          <div className="pointer-events-none absolute bottom-3 right-4 left-4 h-0.5 bg-white/50" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50" />
          <div className="pointer-events-none absolute top-3 left-1/2 h-10 w-20 -translate-x-1/2 border-2 border-t-0 border-white/40" />
          <div className="pointer-events-none absolute bottom-3 left-1/2 h-10 w-20 -translate-x-1/2 border-2 border-b-0 border-white/40" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute top-3 bottom-3 left-1/2 w-0.5 -translate-x-1/2 bg-white/50 sm:top-4 sm:bottom-4" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50 sm:h-20 sm:w-20" />
          <div className="pointer-events-none absolute top-1/2 left-3 h-20 w-10 -translate-y-1/2 border-2 border-l-0 border-white/40 sm:left-4 sm:h-24 sm:w-12" />
          <div className="pointer-events-none absolute top-1/2 right-3 h-20 w-10 -translate-y-1/2 border-2 border-r-0 border-white/40 sm:right-4 sm:h-24 sm:w-12" />
        </>
      )}

      <div className={cn('relative flex h-full', isVertical ? 'flex-col' : 'flex-row')}>
        <TeamHalf
          team={teamA}
          teamSize={teamASize}
          side={isVertical ? 'top' : 'left'}
          layout={layout}
        />
        <TeamHalf
          team={teamB}
          teamSize={teamBSize}
          side={isVertical ? 'bottom' : 'right'}
          layout={layout}
        />
      </div>
    </div>
  );
}

export function PitchView({ match, roster = [] }: { match: MatchRecord; roster?: Player[] }) {
  const displayMatch = roster.length > 0 ? enrichMatchWithRoster(match, roster) : match;
  const teamASize = displayMatch.teamA.players.length;
  const teamBSize = displayMatch.teamB.players.length;
  const matchLabel = getMatchSizeLabel(teamASize, teamBSize);
  const formationLabel =
    teamASize === teamBSize
      ? getFormationLabel(teamASize)
      : `${getFormationLabel(teamASize)} / ${getFormationLabel(teamBSize)}`;

  return (
    <section className="card overflow-visible p-0">
      <div className="border-b border-slate-200/80 bg-white/90 px-4 py-3">
        <p className="text-sm text-slate-500">Match lineup</p>
        <p className="font-display text-base font-bold text-slate-900 sm:text-lg">
          {matchLabel} · {formationLabel} · {formatRatingGap(match.ratingDifference)}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Team strength gap — sum of each team&apos;s OVR ratings. Lower means a fairer split.
        </p>
      </div>

      <div className="px-2 py-4 sm:overflow-x-auto sm:px-4">
        <div className="sm:hidden">
          <PitchField
            layout="vertical"
            teamA={displayMatch.teamA}
            teamB={displayMatch.teamB}
            teamASize={teamASize}
            teamBSize={teamBSize}
          />
        </div>
        <div className="hidden sm:block">
          <PitchField
            layout="horizontal"
            teamA={displayMatch.teamA}
            teamB={displayMatch.teamB}
            teamASize={teamASize}
            teamBSize={teamBSize}
          />
        </div>
      </div>
    </section>
  );
}
