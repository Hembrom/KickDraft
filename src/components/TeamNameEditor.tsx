import { Loader2, Save, Tag } from 'lucide-react';
import { DEFAULT_TEAM_NAMES } from '@shared/types';

export function TeamNameEditor({
  teamCount,
  teamAName,
  teamBName,
  teamCName,
  onTeamANameChange,
  onTeamBNameChange,
  onTeamCNameChange,
  busy,
  onSave,
  onCancel,
}: {
  teamCount: 2 | 3;
  teamAName: string;
  teamBName: string;
  teamCName: string;
  onTeamANameChange: (name: string) => void;
  onTeamBNameChange: (name: string) => void;
  onTeamCNameChange: (name: string) => void;
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="card space-y-4 p-4">
      <div>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
          <Tag className="h-5 w-5 text-elite-500" />
          Rename teams
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Change team labels only — lineups and player assignments stay the same.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block space-y-1">
          <span className="label">Team A</span>
          <input
            className="input"
            value={teamAName}
            onChange={(event) => onTeamANameChange(event.target.value)}
            placeholder={DEFAULT_TEAM_NAMES.a}
            maxLength={40}
          />
        </label>
        <label className="block space-y-1">
          <span className="label">Team B</span>
          <input
            className="input"
            value={teamBName}
            onChange={(event) => onTeamBNameChange(event.target.value)}
            placeholder={DEFAULT_TEAM_NAMES.b}
            maxLength={40}
          />
        </label>
        {teamCount === 3 ? (
          <label className="block space-y-1 sm:col-span-2 lg:col-span-1">
            <span className="label">Team C</span>
            <input
              className="input"
              value={teamCName}
              onChange={(event) => onTeamCNameChange(event.target.value)}
              placeholder={DEFAULT_TEAM_NAMES.c}
              maxLength={40}
            />
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={busy} onClick={onSave}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {busy ? 'Saving…' : 'Save names'}
        </button>
        <button type="button" className="btn-secondary" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </section>
  );
}
