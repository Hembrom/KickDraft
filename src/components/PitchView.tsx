import { formatRatingGap, getMatchSizeLabel, roundRating } from '@shared/types';
import { enrichMatchWithRoster } from '@shared/match-utils';
import { assignPitchRows, getFormationLabel, getPitchSlotRole } from '@shared/pitch-formation';
import type { GeneratedTeam, MatchRecord, Player } from '@shared/types';
import { cn } from '@/lib/utils';
import { PitchPlayerMarker } from './PitchPlayerMarker';

function TeamHalf({
  team,
  teamSize,
  side,
}: {
  team: GeneratedTeam;
  teamSize: number;
  side: 'left' | 'right';
}) {
  const rows = assignPitchRows(team.players, teamSize);
  const rowCount = rows.length;
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
            side === 'left' ? 'bg-blue-600/80' : 'bg-red-600/80',
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
        <p className="font-display text-lg font-bold text-slate-900">
          {matchLabel} · {formationLabel} · {formatRatingGap(match.ratingDifference)}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Team strength gap — sum of each team&apos;s OVR ratings. Lower means a fairer split.
        </p>
      </div>

      <div className="overflow-x-auto px-2 py-4 sm:px-4">
        <div
          className="relative mx-auto min-h-[280px] w-full min-w-[920px] max-w-7xl overflow-visible"
          style={{
            aspectRatio: '2 / 1',
            background: `
              linear-gradient(90deg,
                rgba(34,120,60,0.95) 0%,
                rgba(42,138,72,0.98) 48%,
                rgba(42,138,72,0.98) 52%,
                rgba(34,120,60,0.95) 100%
              )
            `,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 40px,
                  rgba(255,255,255,0.03) 40px,
                  rgba(255,255,255,0.03) 80px
                ),
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 40px,
                  rgba(0,0,0,0.04) 40px,
                  rgba(0,0,0,0.04) 80px
                )
              `,
            }}
          />

          <div className="pointer-events-none absolute inset-3 rounded-lg border-2 border-white/50 sm:inset-4" />
          <div className="pointer-events-none absolute top-3 bottom-3 left-1/2 w-0.5 -translate-x-1/2 bg-white/50 sm:top-4 sm:bottom-4" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50 sm:h-20 sm:w-20" />

          <div className="pointer-events-none absolute top-1/2 left-3 h-20 w-10 -translate-y-1/2 border-2 border-l-0 border-white/40 sm:left-4 sm:h-24 sm:w-12" />
          <div className="pointer-events-none absolute top-1/2 right-3 h-20 w-10 -translate-y-1/2 border-2 border-r-0 border-white/40 sm:right-4 sm:h-24 sm:w-12" />

          <div className="relative flex h-full flex-row">
            <TeamHalf team={displayMatch.teamA} teamSize={teamASize} side="left" />
            <TeamHalf team={displayMatch.teamB} teamSize={teamBSize} side="right" />
          </div>
        </div>
      </div>
    </section>
  );
}
