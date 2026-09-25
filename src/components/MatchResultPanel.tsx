import { useEffect, useState } from 'react';
import { Minus, Plus, User } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  MAX_PLAYER_GOALS,
  goalsAgainst,
  goalsFor,
  matchPlayers,
  scoreTotals,
} from '@shared/match-result';
import {
  isRotationMatch,
  isThreeTeamMatch,
  type MatchRecord,
  type Player,
} from '@shared/types';

const MAX_CONCEDED = 99;

function sortByGoals(players: Player[], scorers: Record<string, number>): Player[] {
  return [...players].sort((a, b) => {
    const goalGap = (scorers[b.id] ?? 0) - (scorers[a.id] ?? 0);
    if (goalGap !== 0) return goalGap;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

function GoalInput({
  value,
  max,
  disabled,
  ariaLabel,
  large,
  onCommit,
}: {
  value: number;
  max: number;
  disabled?: boolean;
  ariaLabel: string;
  large?: boolean;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  function commit(raw: string) {
    const parsed = raw.trim() === '' ? 0 : Number(raw);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = Math.max(0, Math.min(max, Math.trunc(parsed)));
    setDraft(String(next));
    if (next !== value) onCommit(next);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      aria-label={ariaLabel}
      disabled={disabled}
      value={draft}
      onFocus={(event) => {
        setFocused(true);
        event.currentTarget.select();
      }}
      onChange={(event) => setDraft(event.target.value.replace(/\D/g, '').slice(0, 2))}
      onBlur={() => {
        setFocused(false);
        commit(draft);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') {
          setDraft(String(value));
          event.currentTarget.blur();
        }
      }}
      className={cn(
        'rounded-lg border border-slate-200 bg-white text-center font-bold tabular-nums text-slate-900 outline-none focus:border-elite-400 focus:ring-2 focus:ring-elite-100 disabled:opacity-40',
        large
          ? 'h-11 w-14 font-display text-3xl sm:text-4xl'
          : 'h-8 w-10 text-sm',
      )}
    />
  );
}

function teamSections(match: MatchRecord) {
  if (isRotationMatch(match)) {
    return [
      { key: 'A' as const, name: match.teamA.name || 'Starting', players: match.teamA.players },
      { key: 'B' as const, name: match.teamB.name || 'Rotation', players: match.teamB.players },
    ].filter((section) => section.players.length > 0);
  }
  const sections: Array<{ key: 'A' | 'B' | 'C'; name: string; players: Player[] }> = [
    { key: 'A', name: match.teamA.name, players: match.teamA.players },
    { key: 'B', name: match.teamB.name, players: match.teamB.players },
  ];
  if (isThreeTeamMatch(match) && match.teamC) {
    sections.push({ key: 'C', name: match.teamC.name, players: match.teamC.players });
  }
  return sections;
}

function ScoreHero({
  match,
  admin,
  busy,
  onConcededDelta,
  onConcededSet,
}: {
  match: MatchRecord;
  admin?: boolean;
  busy?: boolean;
  onConcededDelta?: (delta: number) => void;
  onConcededSet?: (next: number) => void;
}) {
  const totals = scoreTotals(match);

  if (isRotationMatch(match)) {
    const scored = goalsFor(match);
    const conceded = goalsAgainst(match);
    return (
      <div className="flex items-center justify-center gap-3 sm:gap-6">
        <div className="min-w-0 flex-1 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Us</p>
          <p className="font-display text-4xl font-bold tabular-nums text-slate-900">{scored}</p>
        </div>
        <span className="text-2xl font-semibold text-slate-300">–</span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Them</p>
          {admin && onConcededDelta && onConcededSet ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                disabled={busy || conceded <= 0}
                onClick={() => onConcededDelta(-1)}
                aria-label="Remove a conceded goal"
              >
                <Minus className="h-4 w-4" />
              </button>
              <GoalInput
                value={conceded}
                max={MAX_CONCEDED}
                disabled={busy}
                large
                ariaLabel="Goals conceded"
                onCommit={onConcededSet}
              />
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                disabled={busy}
                onClick={() => onConcededDelta(1)}
                aria-label="Add a conceded goal"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="font-display text-4xl font-bold tabular-nums text-slate-900">{conceded}</p>
          )}
        </div>
      </div>
    );
  }

  if (isThreeTeamMatch(match) && match.teamC) {
    return (
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { name: match.teamA.name, goals: totals.A },
          { name: match.teamB.name, goals: totals.B },
          { name: match.teamC.name, goals: totals.C },
        ].map((side) => (
          <div key={side.name}>
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
              {side.name}
            </p>
            <p className="font-display text-4xl font-bold text-slate-900">{side.goals}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <div className="min-w-0 flex-1 text-right">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
          {match.teamA.name}
        </p>
      </div>
      <p className="font-display text-4xl font-bold tabular-nums text-slate-900">
        {totals.A}
        <span className="mx-2 text-2xl text-slate-300">–</span>
        {totals.B}
      </p>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
          {match.teamB.name}
        </p>
      </div>
    </div>
  );
}

function PlayerGoalRow({
  player,
  goals,
  admin,
  busy,
  onDelta,
  onSet,
}: {
  player: Player;
  goals: number;
  admin: boolean;
  busy: boolean;
  onDelta: (delta: number) => void;
  onSet: (next: number) => void;
}) {
  if (!admin && goals <= 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-2 py-1.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
        {player.photoUrl ? (
          <img src={player.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <User className="h-4 w-4 text-slate-300" />
        )}
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{player.name}</p>
      {admin ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            disabled={busy || goals <= 0}
            onClick={() => onDelta(-1)}
            aria-label={`Remove a goal from ${player.name}`}
          >
            <Minus className="h-4 w-4" />
          </button>
          <GoalInput
            value={goals}
            max={MAX_PLAYER_GOALS}
            disabled={busy}
            ariaLabel={`Goals for ${player.name}`}
            onCommit={onSet}
          />
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            disabled={busy}
            onClick={() => onDelta(1)}
            aria-label={`Add a goal for ${player.name}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <span className="text-sm font-bold tabular-nums text-elite-700">{goals}</span>
      )}
    </div>
  );
}

export function MatchResultPanel({
  slug,
  match,
  admin,
  onMatchChange,
}: {
  slug: string;
  match: MatchRecord;
  admin: boolean;
  onMatchChange: (match: MatchRecord) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [flagging, setFlagging] = useState(false);
  const scorers = match.result?.scorers ?? {};
  const sections = teamSections(match);
  const anyGoals = matchPlayers(match).some((player) => (scorers[player.id] ?? 0) > 0);
  const anyScore = anyGoals || (match.result?.conceded ?? 0) > 0;
  const external = match.external === true;

  if (!admin && !external) return null;
  if (!admin && !anyScore) return null;

  async function changeGoals(playerId: string, delta: number) {
    if (busyId || !external || !Number.isInteger(delta) || delta === 0) return;
    setBusyId(playerId);
    setError('');
    try {
      const updated = await api.adminUpdateMatchResult(slug, match.id, { playerId, delta });
      onMatchChange(updated.match);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update score');
    } finally {
      setBusyId(null);
    }
  }

  async function changeConceded(delta: number) {
    if (busyId || !external || !Number.isInteger(delta) || delta === 0) return;
    setBusyId('conceded');
    setError('');
    try {
      const updated = await api.adminUpdateMatchResult(slug, match.id, { concededDelta: delta });
      onMatchChange(updated.match);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update score');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleExternal(next: boolean) {
    if (flagging) return;
    setFlagging(true);
    setError('');
    try {
      const updated = await api.adminUpdateMatchResult(slug, match.id, { external: next });
      onMatchChange(updated.match);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update match');
    } finally {
      setFlagging(false);
    }
  }

  return (
    <section className="card space-y-4 p-4 sm:p-5">
      {admin ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-elite-600 focus:ring-elite-500"
            checked={external}
            disabled={flagging}
            onChange={(event) => void toggleExternal(event.target.checked)}
          />
          {flagging ? 'Saving…' : 'External match'}
          <span className="font-normal text-slate-500">
            — vs another side. Only these scores count.
          </span>
        </label>
      ) : (
        <p className="text-xs font-semibold uppercase tracking-wide text-elite-600">
          External match
        </p>
      )}

      {admin && external && !match.recordedAsPlayed ? (
        <p className="text-sm text-slate-500">
          Tick <span className="font-semibold text-slate-700">Count as played</span> as well so
          this game counts for External attendance.
        </p>
      ) : null}

      {external ? (
        <ScoreHero
          match={match}
          admin={admin}
          busy={busyId === 'conceded'}
          onConcededDelta={(delta) => void changeConceded(delta)}
          onConcededSet={(next) => void changeConceded(next - goalsAgainst(match))}
        />
      ) : admin ? (
        <p className="text-sm text-slate-500">
          Tick External match to record the score and goal scorers. Internal splits and rotation
          nights stay uncounted.
        </p>
      ) : null}

      {external ? (
        <div className={cn('grid gap-4', sections.length > 1 && 'sm:grid-cols-2', sections.length > 2 && 'lg:grid-cols-3')}>
          {sections.map((section) => {
            const rows = sortByGoals(
              admin
                ? section.players
                : section.players.filter((player) => (scorers[player.id] ?? 0) > 0),
              scorers,
            );
            if (rows.length === 0) return null;
            return (
              <div key={section.key} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {section.name}
                  {admin ? '' : ' scorers'}
                </p>
                <div className="space-y-1.5">
                  {rows.map((player) => (
                    <PlayerGoalRow
                      key={player.id}
                      player={player}
                      goals={scorers[player.id] ?? 0}
                      admin={admin}
                      busy={busyId === player.id}
                      onDelta={(delta) => void changeGoals(player.id, delta)}
                      onSet={(next) => void changeGoals(player.id, next - (scorers[player.id] ?? 0))}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {admin && external ? (
        <p className="text-xs text-slate-500">
          {isRotationMatch(match)
            ? 'Type a number or use + / −. Us is the sum of those goals. Them is goals conceded.'
            : 'Type a number or use + / −. The match score is the sum of those goals.'}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
