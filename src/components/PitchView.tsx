import { type Ref } from 'react';
import { getMatchSizeLabel } from '@shared/types';
import { enrichMatchWithRoster } from '@shared/match-utils';
import { assignPitchRows, getPitchSlotRole } from '@shared/pitch-formation';
import type { GeneratedTeam, MatchRecord, Player } from '@shared/types';
import { cn } from '@/lib/utils';
import { PitchPlayerMarker } from './PitchPlayerMarker';

type PitchLayout = 'horizontal' | 'vertical';
type TeamSide = 'left' | 'right' | 'top' | 'bottom';

function teamRowCount(team: GeneratedTeam, teamSize: number) {
  return assignPitchRows(team.players, teamSize).length;
}

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
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-1 py-1">
        <div
          className={cn(
            'pointer-events-none absolute z-20 flex flex-col gap-0.5',
            side === 'top' ? 'left-2 top-1 items-start' : 'bottom-1 left-2 items-start',
          )}
        >
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90',
              teamColor,
            )}
          >
            {team.name}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-evenly gap-0.5 px-1 py-5">
          {displayRows.map((row, rowIndex) => {
            const roleIndex = side === 'top' ? rowIndex : rowCount - 1 - rowIndex;
            const slotRole = getPitchSlotRole(roleIndex, rowCount);

            return (
              <div
                key={`${side}-row-${rowIndex}`}
                className="flex min-h-0 flex-row items-end justify-evenly gap-0.5 px-0.5"
              >
                {row.map((player) => (
                  <PitchPlayerMarker
                    key={player.id}
                    player={player}
                    pitchRole={slotRole}
                    compact
                  />
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
  const maxRows = Math.max(teamRowCount(teamA, teamASize), teamRowCount(teamB, teamBSize));
  const mobileHeight = Math.max(540, 100 + maxRows * 2 * 58);

  return (
    <div
      className={cn(
        'relative mx-auto w-full',
        isVertical
          ? 'flex max-w-lg flex-col overflow-hidden'
          : 'min-h-[280px] min-w-[920px] max-w-7xl overflow-visible aspect-[2/1]',
      )}
      style={{
        ...(isVertical ? { height: mobileHeight } : {}),
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

      <div className="pointer-events-none absolute inset-2 rounded-lg border-2 border-white/50 sm:inset-4" />

      {isVertical ? (
        <>
          <div className="pointer-events-none absolute top-2 right-3 left-3 h-0.5 bg-white/50" />
          <div className="pointer-events-none absolute top-1/2 right-3 left-3 h-0.5 -translate-y-1/2 bg-white/50" />
          <div className="pointer-events-none absolute bottom-2 right-3 left-3 h-0.5 bg-white/50" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50" />
          <div className="pointer-events-none absolute top-2 left-1/2 h-8 w-16 -translate-x-1/2 border-2 border-t-0 border-white/40" />
          <div className="pointer-events-none absolute bottom-2 left-1/2 h-8 w-16 -translate-x-1/2 border-2 border-b-0 border-white/40" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute top-3 bottom-3 left-1/2 w-0.5 -translate-x-1/2 bg-white/50 sm:top-4 sm:bottom-4" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50 sm:h-20 sm:w-20" />
          <div className="pointer-events-none absolute top-1/2 left-3 h-20 w-10 -translate-y-1/2 border-2 border-l-0 border-white/40 sm:left-4 sm:h-24 sm:w-12" />
          <div className="pointer-events-none absolute top-1/2 right-3 h-20 w-10 -translate-y-1/2 border-2 border-r-0 border-white/40 sm:right-4 sm:h-24 sm:w-12" />
        </>
      )}

      <div
        className={cn(
          'relative flex min-h-0',
          isVertical ? 'h-full flex-col' : 'h-full flex-row',
        )}
      >
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

export function PitchView({
  match,
  roster = [],
  pitchCaptureRef,
}: {
  match: MatchRecord;
  roster?: Player[];
  pitchCaptureRef?: Ref<HTMLDivElement>;
}) {
  const displayMatch = roster.length > 0 ? enrichMatchWithRoster(match, roster) : match;
  const teamASize = displayMatch.teamA.players.length;
  const teamBSize = displayMatch.teamB.players.length;
  const matchLabel = getMatchSizeLabel(teamASize, teamBSize);
  const matchTitle = (match.name ?? '').trim();

  return (
    <section className="card overflow-hidden p-0 sm:overflow-visible">
      <div className="border-b border-slate-200/80 bg-white/90 px-4 py-3">
        <p className="text-sm text-slate-500">Match lineup</p>
        <p className="font-display text-lg font-bold text-slate-900">
          {matchTitle || matchLabel}
        </p>
      </div>

      <div ref={pitchCaptureRef} className="w-full overflow-hidden sm:overflow-x-auto">
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
