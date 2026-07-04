import { roundRating, type GeneratedTeam } from '@shared/types';
import { PlayerCard } from './PlayerCard';

export function TeamPanel({ team, accent }: { team: GeneratedTeam; accent: 'a' | 'b' }) {
  const colors =
    accent === 'a'
      ? 'from-elite-100/90 to-white border-elite-200'
      : 'from-slate-100/90 to-white border-slate-200';

  return (
    <section className={`card overflow-hidden border bg-gradient-to-b ${colors}`}>
      <div className="border-b border-slate-200/80 px-4 py-3">
        <h3 className="font-display text-lg font-bold text-slate-900">{team.name}</h3>
        <div className="mt-1 flex gap-4 text-xs text-slate-500">
          <span>Total {roundRating(team.totalRating)}</span>
          <span>Avg {roundRating(team.averageRating)}</span>
        </div>
      </div>
      <div className="space-y-2 p-3">
        {team.players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </section>
  );
}
