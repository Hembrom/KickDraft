import { useState, type Ref } from 'react';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { enrichMatchWithRoster } from '@shared/match-utils';
import { assignPitchRows, getFormationLabel, getPitchSlotRole } from '@shared/pitch-formation';
import { getMatchLabel, type GeneratedTeam, type MatchRecord, type Player } from '@shared/types';
import { cn } from '@/lib/utils';
import { PitchPlayerMarker } from './PitchPlayerMarker';

const TEAM_STYLES = {
  a: {
    badge: 'bg-blue-600/90',
    border: 'border-blue-200',
    header: 'bg-blue-50',
  },
  b: {
    badge: 'bg-red-600/90',
    border: 'border-red-200',
    header: 'bg-red-50',
  },
  c: {
    badge: 'bg-amber-600/90',
    border: 'border-amber-200',
    header: 'bg-amber-50',
  },
} as const;

type TeamKey = keyof typeof TEAM_STYLES;

function SingleTeamLineup({ team, teamSize }: { team: GeneratedTeam; teamSize: number }) {
  const rows = assignPitchRows(team.players, teamSize);
  const rowCount = rows.length;

  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-xl border border-white/20"
      style={{
        minHeight: 280,
        background: `linear-gradient(180deg,
          rgba(34,120,60,0.95) 0%,
          rgba(42,138,72,0.98) 50%,
          rgba(34,120,60,0.95) 100%
        )`,
      }}
    >
      <div className="pointer-events-none absolute inset-2 rounded-lg border-2 border-white/40" />
      <div className="pointer-events-none absolute top-1/2 right-3 left-3 h-0.5 -translate-y-1/2 bg-white/40" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />

      <div className="flex min-h-[280px] flex-col justify-evenly gap-1 px-2 py-6">
        {rows.map((row, rowIndex) => {
          const slotRole = getPitchSlotRole(rowIndex, rowCount);
          return (
            <div
              key={`row-${rowIndex}`}
              className="flex flex-row items-end justify-evenly gap-1"
            >
              {row.map((player) => (
                <PitchPlayerMarker key={player.id} player={player} pitchRole={slotRole} compact />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamCard({
  teamKey,
  team,
  defaultOpen = true,
}: {
  teamKey: TeamKey;
  team: GeneratedTeam;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const styles = TEAM_STYLES[teamKey];
  const teamSize = team.players.length;
  const formation = getFormationLabel(teamSize);

  return (
    <article className={cn('overflow-hidden rounded-2xl border bg-white shadow-sm', styles.border)}>
      <div className={cn('border-b px-4 py-3', styles.header, styles.border)}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white',
                styles.badge,
              )}
            >
              {team.name}
            </span>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Users className="h-4 w-4 text-slate-500" />
              {teamSize} players
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Formation {formation} · avg OVR {team.averageRating}
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <>
                Hide lineup <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                View lineup <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div className="p-3">
          <SingleTeamLineup team={team} teamSize={teamSize} />
        </div>
      ) : null}
    </article>
  );
}

export function ThreeTeamMatchView({
  match,
  roster = [],
  pitchCaptureRef,
}: {
  match: MatchRecord;
  roster?: Player[];
  pitchCaptureRef?: Ref<HTMLDivElement>;
}) {
  const displayMatch = roster.length > 0 ? enrichMatchWithRoster(match, roster) : match;
  const teamC = displayMatch.teamC;
  if (!teamC) return null;

  const matchLabel = getMatchLabel(displayMatch);
  const matchTitle = (match.name ?? '').trim();

  return (
    <section className="card overflow-hidden p-0">
      <div className="border-b border-slate-200/80 bg-white/90 px-4 py-3">
        <p className="text-sm text-slate-500">Three-way split</p>
        <p className="font-display text-lg font-bold text-slate-900">
          {matchTitle || matchLabel}
        </p>
      </div>

      <div
        ref={pitchCaptureRef}
        className="space-y-4 p-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0"
      >
        <TeamCard teamKey="a" team={displayMatch.teamA} />
        <TeamCard teamKey="b" team={displayMatch.teamB} />
        <TeamCard teamKey="c" team={teamC} />
      </div>
    </section>
  );
}
