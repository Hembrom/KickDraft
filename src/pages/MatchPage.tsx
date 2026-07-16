import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Loader2, Pencil, Share2, Shuffle } from 'lucide-react';
import { PitchView } from '@/components/PitchView';
import { TeamEditor, type EditTab, type EditorTeam } from '@/components/TeamEditor';
import { api, ApiError } from '@/lib/api';
import { shareMatchLineup } from '@/lib/share-match';
import { formatDate } from '@/lib/utils';
import { enrichMatchWithRoster } from '@shared/match-utils';
import {
  buildGeneratedTeam,
  generateBalancedTeamsWithLocks,
} from '@shared/team-generator';
import { getMatchSizeLabel, type MatchRecord, type Player } from '@shared/types';

export function MatchPage() {
  const { slug = '', matchId = '' } = useParams();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTab, setEditTab] = useState<EditTab>('lock');
  const [saving, setSaving] = useState(false);
  const [draftTeamA, setDraftTeamA] = useState<Player[]>([]);
  const [draftTeamB, setDraftTeamB] = useState<Player[]>([]);
  const [draftPool, setDraftPool] = useState<Player[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const pitchCaptureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([api.getMatch(slug, matchId), api.getGroup(slug)])
      .then(([matchData, groupData]) => {
        setMatch(matchData);
        setGroupName(groupData.name);
        setPlayers(groupData.players);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load match');
      })
      .finally(() => setLoading(false));
  }, [slug, matchId]);

  async function handleShuffleAgain() {
    if (!match || shuffling) return;
    setShuffling(true);
    setError('');
    try {
      const newMatch = await api.generateMatch(
        slug,
        match.selectedPlayerIds,
        (match.name ?? '').trim(),
      );
      navigate(`/${slug}/match/${newMatch.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to shuffle teams');
    } finally {
      setShuffling(false);
    }
  }

  async function handleShare() {
    if (!match || sharing) return;
    setSharing(true);
    setError('');
    try {
      const result = await shareMatchLineup({
        match,
        groupName,
        captureEl: pitchCaptureRef.current,
      });
      if (result === 'copied') {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setError('Could not share — try copying the link from your browser bar.');
    } finally {
      setSharing(false);
    }
  }

  function editablePlayers(): Player[] {
    if (!match) return [];
    const current = enrichMatchWithRoster(match, players);
    return [...current.teamA.players, ...current.teamB.players].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  function resetDraft(tab: EditTab) {
    setEditTab(tab);
    setDraftTeamA([]);
    setDraftTeamB([]);
    setDraftPool(editablePlayers());
    setError('');
  }

  function startEditing() {
    if (!match) return;
    resetDraft('lock');
    setEditing(true);
  }

  function cancelEditing() {
    if (saving) return;
    setEditing(false);
    setEditTab('lock');
    setDraftTeamA([]);
    setDraftTeamB([]);
    setDraftPool([]);
    setError('');
  }

  function switchEditTab(nextTab: EditTab) {
    if (!match || nextTab === editTab) return;
    resetDraft(nextTab);
  }

  function findPlayerLocation(playerId: string): 'a' | 'b' | 'pool' | null {
    if (draftTeamA.some((player) => player.id === playerId)) return 'a';
    if (draftTeamB.some((player) => player.id === playerId)) return 'b';
    if (draftPool.some((player) => player.id === playerId)) return 'pool';
    return null;
  }

  function swapPlayers(
    fromTeam: EditorTeam,
    fromPlayerId: string,
    toTeam: EditorTeam,
    toPlayerId: string,
  ) {
    if (fromTeam === toTeam || fromPlayerId === toPlayerId) return;

    const playerAId = fromTeam === 'a' ? fromPlayerId : toPlayerId;
    const playerBId = fromTeam === 'b' ? fromPlayerId : toPlayerId;
    const indexA = draftTeamA.findIndex((player) => player.id === playerAId);
    const indexB = draftTeamB.findIndex((player) => player.id === playerBId);
    if (indexA === -1 || indexB === -1) return;

    const nextA = [...draftTeamA];
    const nextB = [...draftTeamB];
    const fromA = nextA[indexA];
    nextA[indexA] = nextB[indexB];
    nextB[indexB] = fromA;
    setDraftTeamA(nextA);
    setDraftTeamB(nextB);
    setError('');
  }

  function reorderPlayers(team: EditorTeam, fromPlayerId: string, toPlayerId: string) {
    if (fromPlayerId === toPlayerId) return;
    const list = team === 'a' ? draftTeamA : draftTeamB;
    const fromIndex = list.findIndex((player) => player.id === fromPlayerId);
    const toIndex = list.findIndex((player) => player.id === toPlayerId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...list];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    if (team === 'a') setDraftTeamA(next);
    else setDraftTeamB(next);
    setError('');
  }

  function returnPlayerToPool(playerId: string) {
    const location = findPlayerLocation(playerId);
    if (location !== 'a' && location !== 'b') return;

    const source = location === 'a' ? draftTeamA : draftTeamB;
    const index = source.findIndex((player) => player.id === playerId);
    if (index === -1) return;

    const nextSource = [...source];
    const [player] = nextSource.splice(index, 1);
    if (location === 'a') setDraftTeamA(nextSource);
    else setDraftTeamB(nextSource);
    setDraftPool((current) =>
      [...current, player].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setError('');
  }

  function movePlayerToTeam(playerId: string, targetTeam: EditorTeam) {
    if (!match) return;

    const location = findPlayerLocation(playerId);
    if (!location || location === targetTeam) return;

    const player = [...draftTeamA, ...draftTeamB, ...draftPool].find((p) => p.id === playerId);
    if (!player) return;

    const targetCapacity =
      targetTeam === 'a' ? match.teamA.players.length : match.teamB.players.length;
    const targetPlayers = targetTeam === 'a' ? draftTeamA : draftTeamB;
    if (targetPlayers.length >= targetCapacity) {
      setError(
        `Team ${targetTeam === 'a' ? 'A' : 'B'} is full (${targetCapacity}). Return someone first.`,
      );
      return;
    }

    const without = (list: Player[]) => list.filter((p) => p.id !== playerId);
    setDraftPool((current) => without(current));
    setDraftTeamA((current) =>
      targetTeam === 'a' ? [...without(current), player] : without(current),
    );
    setDraftTeamB((current) =>
      targetTeam === 'b' ? [...without(current), player] : without(current),
    );
    setError('');
  }

  function fillRestOfTeams() {
    if (!match) return;
    try {
      const all = [...draftTeamA, ...draftTeamB, ...draftPool];
      const result = generateBalancedTeamsWithLocks(
        all,
        match.teamA.players.length,
        match.teamB.players.length,
        {
          teamA: draftTeamA.map((player) => player.id),
          teamB: draftTeamB.map((player) => player.id),
        },
      );
      setDraftTeamA(result.teamA.players);
      setDraftTeamB(result.teamB.players);
      setDraftPool([]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fill the teams');
    }
  }

  async function saveEditedTeams() {
    if (!match || saving) return;

    const teamACapacity = match.teamA.players.length;
    const teamBCapacity = match.teamB.players.length;
    if (
      draftTeamA.length !== teamACapacity ||
      draftTeamB.length !== teamBCapacity ||
      draftPool.length > 0
    ) {
      setError(`Assign all players first (${teamACapacity}v${teamBCapacity}).`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const updated = await api.updateMatch(
        slug,
        match.id,
        draftTeamA.map((player) => player.id),
        draftTeamB.map((player) => player.id),
      );
      setMatch(updated);
      setEditing(false);
      setEditTab('lock');
      setDraftTeamA([]);
      setDraftTeamB([]);
      setDraftPool([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save teams');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading match…</p>;
  }

  if (error && !match) {
    return (
      <div className="card p-6">
        <p className="text-red-600">{error}</p>
        <Link to={`/${slug}`} className="btn-secondary mt-4 inline-flex">
          Back to squad
        </Link>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Match not found</p>
        <Link to={`/${slug}`} className="btn-secondary mt-4 inline-flex">
          Back to squad
        </Link>
      </div>
    );
  }

  const matchLabel = getMatchSizeLabel(match.teamA.players.length, match.teamB.players.length);
  const displayTitle = (match.name ?? '').trim() || `${matchLabel} lineup`;
  const teamsComplete =
    draftTeamA.length === match.teamA.players.length &&
    draftTeamB.length === match.teamB.players.length &&
    draftPool.length === 0;
  const displayedMatch =
    editing && teamsComplete
      ? {
          ...match,
          teamA: buildGeneratedTeam('Team A', draftTeamA),
          teamB: buildGeneratedTeam('Team B', draftTeamB),
        }
      : match;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{groupName}</p>
          <h1 className="font-display text-3xl font-bold text-slate-900">{displayTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {matchLabel} · {formatDate(match.date)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            disabled={editing || shuffling || sharing}
            onClick={startEditing}
          >
            <Pencil className="h-4 w-4" />
            Edit teams
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={editing || shuffling || sharing}
            onClick={handleShuffleAgain}
          >
            {shuffling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="h-4 w-4" />
            )}
            {shuffling ? 'Shuffling…' : 'Shuffle again'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={editing || sharing || shuffling}
            onClick={handleShare}
          >
            {sharing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {sharing ? 'Preparing…' : copied ? 'Copied' : 'Share match'}
          </button>
          <Link to={`/${slug}`} className="btn-secondary">
            New match
          </Link>
          <Link to={`/${slug}/history`} className="btn-secondary">
            History
          </Link>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Edit teams has Lock &amp; shuffle plus Manual assignment. Shuffle again opens a separate
        lineup link.
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {editing ? (
        <TeamEditor
          tab={editTab}
          onTabChange={switchEditTab}
          teamAPlayers={draftTeamA}
          teamBPlayers={draftTeamB}
          poolPlayers={draftPool}
          teamACapacity={match.teamA.players.length}
          teamBCapacity={match.teamB.players.length}
          busy={saving}
          canSave={teamsComplete}
          onMoveToTeam={movePlayerToTeam}
          onReturnToPool={returnPlayerToPool}
          onReorder={reorderPlayers}
          onSwap={swapPlayers}
          onFillRest={fillRestOfTeams}
          onSave={saveEditedTeams}
          onCancel={cancelEditing}
        />
      ) : null}

      {editing && !teamsComplete ? (
        <p className="text-sm text-slate-500">
          Pitch preview updates once both teams are fully assigned.
        </p>
      ) : (
        <PitchView
          pitchCaptureRef={pitchCaptureRef}
          match={displayedMatch}
          roster={players}
        />
      )}
    </div>
  );
}
