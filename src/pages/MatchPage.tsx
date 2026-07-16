import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Loader2, Pencil, Share2, Shuffle } from 'lucide-react';
import { PitchView } from '@/components/PitchView';
import {
  TeamEditor,
  type EditorTeam,
  type SelectedEditorPlayer,
} from '@/components/TeamEditor';
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
  const [saving, setSaving] = useState(false);
  const [draftTeamA, setDraftTeamA] = useState<Player[]>([]);
  const [draftTeamB, setDraftTeamB] = useState<Player[]>([]);
  const [lockedA, setLockedA] = useState<Set<string>>(new Set());
  const [lockedB, setLockedB] = useState<Set<string>>(new Set());
  const [selectedEditorPlayer, setSelectedEditorPlayer] =
    useState<SelectedEditorPlayer | null>(null);
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

  function startEditing() {
    if (!match) return;
    const current = enrichMatchWithRoster(match, players);
    setDraftTeamA(current.teamA.players);
    setDraftTeamB(current.teamB.players);
    setLockedA(new Set());
    setLockedB(new Set());
    setSelectedEditorPlayer(null);
    setError('');
    setEditing(true);
  }

  function cancelEditing() {
    if (saving) return;
    setEditing(false);
    setSelectedEditorPlayer(null);
    setError('');
  }

  function toggleLock(team: EditorTeam, playerId: string) {
    const current = team === 'a' ? lockedA : lockedB;
    const update = team === 'a' ? setLockedA : setLockedB;
    const next = new Set(current);
    if (next.has(playerId)) {
      next.delete(playerId);
    } else {
      if (next.size >= 4) {
        setError('You can lock up to 4 players on each team.');
        return;
      }
      next.add(playerId);
    }
    setError('');
    update(next);
  }

  function unlockPlayers(...playerIds: string[]) {
    setLockedA((current) => {
      const next = new Set(current);
      for (const id of playerIds) next.delete(id);
      return next;
    });
    setLockedB((current) => {
      const next = new Set(current);
      for (const id of playerIds) next.delete(id);
      return next;
    });
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

    // Manual placement wins; unlock swapped players so lock labels stay truthful.
    unlockPlayers(playerAId, playerBId);
    setSelectedEditorPlayer(null);
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
    setSelectedEditorPlayer(null);
    setError('');
  }

  function movePlayerToTeam(playerId: string, targetTeam: EditorTeam) {
    if (!match) return;

    const sourceTeam = draftTeamA.some((player) => player.id === playerId) ? 'a' : 'b';
    if (sourceTeam === targetTeam) return;

    const sourcePlayers = sourceTeam === 'a' ? draftTeamA : draftTeamB;
    const targetPlayers = targetTeam === 'a' ? draftTeamA : draftTeamB;
    const sourceIndex = sourcePlayers.findIndex((player) => player.id === playerId);
    if (sourceIndex === -1) return;

    const targetCapacity =
      targetTeam === 'a' ? match.teamA.players.length : match.teamB.players.length;
    const targetLocks = targetTeam === 'a' ? lockedA : lockedB;
    const movingPlayer = sourcePlayers[sourceIndex];
    const nextSource = [...sourcePlayers];
    const nextTarget = [...targetPlayers];

    nextSource.splice(sourceIndex, 1);

    if (nextTarget.length >= targetCapacity) {
      const swapOut = nextTarget
        .map((player, index) => ({ player, index }))
        .filter(({ player }) => !targetLocks.has(player.id))
        .sort((a, b) => a.player.ovr - b.player.ovr)[0];

      if (!swapOut) {
        setError('Unlock someone on that team before moving another player there.');
        return;
      }

      nextTarget.splice(swapOut.index, 1, movingPlayer);
      nextSource.push(swapOut.player);
      unlockPlayers(playerId, swapOut.player.id);
    } else {
      nextTarget.push(movingPlayer);
      unlockPlayers(playerId);
    }

    if (sourceTeam === 'a') {
      setDraftTeamA(nextSource);
      setDraftTeamB(nextTarget);
    } else {
      setDraftTeamB(nextSource);
      setDraftTeamA(nextTarget);
    }
    setSelectedEditorPlayer(null);
    setError('');
  }

  function selectPlayerToSwap(team: EditorTeam, playerId: string) {
    if (!selectedEditorPlayer || selectedEditorPlayer.team === team) {
      setSelectedEditorPlayer(
        selectedEditorPlayer?.team === team && selectedEditorPlayer.playerId === playerId
          ? null
          : { team, playerId },
      );
      return;
    }

    swapPlayers(selectedEditorPlayer.team, selectedEditorPlayer.playerId, team, playerId);
  }

  function shuffleUnlocked() {
    try {
      const result = generateBalancedTeamsWithLocks(
        [...draftTeamA, ...draftTeamB],
        draftTeamA.length,
        draftTeamB.length,
        { teamA: [...lockedA], teamB: [...lockedB] },
      );
      setDraftTeamA(result.teamA.players);
      setDraftTeamB(result.teamB.players);
      setSelectedEditorPlayer(null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not shuffle unlocked players');
    }
  }

  async function saveEditedTeams() {
    if (!match || saving) return;
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
      setSelectedEditorPlayer(null);
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
  const displayedMatch = editing
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
        Edit teams lets you lock, reshuffle, swap, and save this lineup. Shuffle again opens a
        separate lineup link.
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {editing ? (
        <TeamEditor
          teamAPlayers={draftTeamA}
          teamBPlayers={draftTeamB}
          lockedA={lockedA}
          lockedB={lockedB}
          selected={selectedEditorPlayer}
          busy={saving}
          onToggleLock={toggleLock}
          onSelect={selectPlayerToSwap}
          onSwap={swapPlayers}
          onReorder={reorderPlayers}
          onMoveToTeam={movePlayerToTeam}
          onShuffle={shuffleUnlocked}
          onSave={saveEditedTeams}
          onCancel={cancelEditing}
        />
      ) : null}

      <PitchView
        pitchCaptureRef={pitchCaptureRef}
        match={displayedMatch}
        roster={players}
      />
    </div>
  );
}
