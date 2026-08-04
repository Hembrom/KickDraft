import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Loader2, Pencil, Share2, Shuffle, Tag } from 'lucide-react';
import { PitchView } from '@/components/PitchView';
import { ThreeTeamMatchView } from '@/components/ThreeTeamMatchView';
import { TeamEditor, type EditTab, type EditorTeam } from '@/components/TeamEditor';
import { TeamNameEditor } from '@/components/TeamNameEditor';
import { api, ApiError } from '@/lib/api';
import { shareMatchLineup } from '@/lib/share-match';
import { formatDate, getAdminToken } from '@/lib/utils';
import { enrichMatchWithRoster } from '@shared/match-utils';
import {
  buildGeneratedTeam,
  generateBalancedTeamsWithLocks,
  generateBalancedThreeTeamsWithLocks,
} from '@shared/team-generator';
import { getMatchLabel, isThreeTeamMatch, sanitizeTeamName, DEFAULT_TEAM_NAMES, type MatchRecord, type Player } from '@shared/types';

function teamLabel(team: EditorTeam): string {
  if (team === 'a') return 'A';
  if (team === 'b') return 'B';
  return 'C';
}

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
  const [renamingTeams, setRenamingTeams] = useState(false);
  const [editTab, setEditTab] = useState<EditTab>('swap');
  const [saving, setSaving] = useState(false);
  const [draftTeamA, setDraftTeamA] = useState<Player[]>([]);
  const [draftTeamB, setDraftTeamB] = useState<Player[]>([]);
  const [draftTeamC, setDraftTeamC] = useState<Player[]>([]);
  const [draftTeamAName, setDraftTeamAName] = useState<string>(DEFAULT_TEAM_NAMES.a);
  const [draftTeamBName, setDraftTeamBName] = useState<string>(DEFAULT_TEAM_NAMES.b);
  const [draftTeamCName, setDraftTeamCName] = useState<string>(DEFAULT_TEAM_NAMES.c);
  const [draftPool, setDraftPool] = useState<Player[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pitchCaptureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsAdmin(Boolean(getAdminToken()));
  }, []);

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

  async function handleRecordToggle(recorded: boolean) {
    if (!match || recording) return;
    if (
      recorded &&
      !confirm(
        'Count this match as played?\n\nEvery player on the pitch will get +1 games played. You can undo later.',
      )
    ) {
      return;
    }
    if (
      !recorded &&
      !confirm('Remove this match from games-played data? Player counts will decrease.')
    ) {
      return;
    }

    setRecording(true);
    setError('');
    try {
      const result = await api.adminRecordMatch(slug, match.id, recorded);
      setMatch(result.match);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update record status');
    } finally {
      setRecording(false);
    }
  }

  async function handleShuffleAgain() {
    if (!match || shuffling) return;
    setShuffling(true);
    setError('');
    try {
      const newMatch = await api.generateMatch(
        slug,
        match.selectedPlayerIds,
        (match.name ?? '').trim(),
        match.teamCount === 3 ? 3 : 2,
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
    const roster = [...current.teamA.players, ...current.teamB.players];
    if (current.teamC) roster.push(...current.teamC.players);
    return roster.sort((a, b) => a.name.localeCompare(b.name));
  }

  function resetDraft(tab: EditTab) {
    if (!match) return;
    setEditTab(tab);
    setDraftTeamAName(match.teamA.name);
    setDraftTeamBName(match.teamB.name);
    setDraftTeamCName(match.teamC?.name ?? DEFAULT_TEAM_NAMES.c);
    setError('');

    if (tab === 'swap' && !isThreeTeamMatch(match)) {
      const current = enrichMatchWithRoster(match, players);
      setDraftTeamA([...current.teamA.players]);
      setDraftTeamB([...current.teamB.players]);
      setDraftTeamC([]);
      setDraftPool([]);
      return;
    }

    setDraftTeamA([]);
    setDraftTeamB([]);
    setDraftTeamC([]);
    setDraftPool(editablePlayers());
  }

  function startRenamingTeams() {
    if (!match) return;
    setRenamingTeams(true);
    setDraftTeamAName(match.teamA.name);
    setDraftTeamBName(match.teamB.name);
    setDraftTeamCName(match.teamC?.name ?? DEFAULT_TEAM_NAMES.c);
    setError('');
  }

  function cancelRenamingTeams() {
    if (saving) return;
    setRenamingTeams(false);
    setDraftTeamAName(DEFAULT_TEAM_NAMES.a);
    setDraftTeamBName(DEFAULT_TEAM_NAMES.b);
    setDraftTeamCName(DEFAULT_TEAM_NAMES.c);
    setError('');
  }

  async function saveRenamedTeams() {
    if (!match || saving) return;

    setSaving(true);
    setError('');
    try {
      const updated = await api.updateMatchTeamNames(slug, match.id, {
        teamA: sanitizeTeamName(draftTeamAName, match.teamA.name),
        teamB: sanitizeTeamName(draftTeamBName, match.teamB.name),
        ...(isThreeTeamMatch(match)
          ? { teamC: sanitizeTeamName(draftTeamCName, match.teamC?.name ?? DEFAULT_TEAM_NAMES.c) }
          : {}),
      });
      setMatch(updated);
      setRenamingTeams(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save team names');
    } finally {
      setSaving(false);
    }
  }

  function startEditing() {
    if (!match) return;
    resetDraft(isThreeTeamMatch(match) ? 'lock' : 'swap');
    setEditing(true);
  }

  function cancelEditing() {
    if (saving) return;
    setEditing(false);
    setEditTab(match && isThreeTeamMatch(match) ? 'lock' : 'swap');
    setDraftTeamA([]);
    setDraftTeamB([]);
    setDraftTeamC([]);
    setDraftPool([]);
    setDraftTeamAName(DEFAULT_TEAM_NAMES.a);
    setDraftTeamBName(DEFAULT_TEAM_NAMES.b);
    setDraftTeamCName(DEFAULT_TEAM_NAMES.c);
    setError('');
  }

  function updateDraftTeamName(team: EditorTeam, name: string) {
    if (team === 'a') setDraftTeamAName(name);
    else if (team === 'b') setDraftTeamBName(name);
    else setDraftTeamCName(name);
  }

  function switchEditTab(nextTab: EditTab) {
    if (!match || nextTab === editTab) return;
    resetDraft(nextTab);
  }

  function getDraftTeam(team: EditorTeam): Player[] {
    if (team === 'a') return draftTeamA;
    if (team === 'b') return draftTeamB;
    return draftTeamC;
  }

  function setDraftTeam(team: EditorTeam, players: Player[]) {
    if (team === 'a') setDraftTeamA(players);
    else if (team === 'b') setDraftTeamB(players);
    else setDraftTeamC(players);
  }

  function findPlayerLocation(playerId: string): EditorTeam | 'pool' | null {
    if (draftTeamA.some((player) => player.id === playerId)) return 'a';
    if (draftTeamB.some((player) => player.id === playerId)) return 'b';
    if (draftTeamC.some((player) => player.id === playerId)) return 'c';
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

    const fromList = getDraftTeam(fromTeam);
    const toList = getDraftTeam(toTeam);
    const fromIndex = fromList.findIndex((player) => player.id === fromPlayerId);
    const toIndex = toList.findIndex((player) => player.id === toPlayerId);
    if (fromIndex === -1 || toIndex === -1) return;

    const nextFrom = [...fromList];
    const nextTo = [...toList];
    const swapped = nextFrom[fromIndex];
    nextFrom[fromIndex] = nextTo[toIndex];
    nextTo[toIndex] = swapped;
    setDraftTeam(fromTeam, nextFrom);
    setDraftTeam(toTeam, nextTo);
    setError('');
  }

  function reorderPlayers(team: EditorTeam, fromPlayerId: string, toPlayerId: string) {
    if (fromPlayerId === toPlayerId) return;
    const list = getDraftTeam(team);
    const fromIndex = list.findIndex((player) => player.id === fromPlayerId);
    const toIndex = list.findIndex((player) => player.id === toPlayerId);
    if (fromIndex === -1 || toIndex === -1) return;

    const next = [...list];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setDraftTeam(team, next);
    setError('');
  }

  function returnPlayerToPool(playerId: string) {
    const location = findPlayerLocation(playerId);
    if (!location || location === 'pool') return;

    const source = getDraftTeam(location);
    const index = source.findIndex((player) => player.id === playerId);
    if (index === -1) return;

    const nextSource = [...source];
    const [player] = nextSource.splice(index, 1);
    setDraftTeam(location, nextSource);
    setDraftPool((current) =>
      [...current, player].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setError('');
  }

  function movePlayerToTeam(playerId: string, targetTeam: EditorTeam) {
    if (!match) return;

    const location = findPlayerLocation(playerId);
    if (!location || location === targetTeam) return;

    const player = [...draftTeamA, ...draftTeamB, ...draftTeamC, ...draftPool].find(
      (p) => p.id === playerId,
    );
    if (!player) return;

    const targetCapacity =
      targetTeam === 'a'
        ? match.teamA.players.length
        : targetTeam === 'b'
          ? match.teamB.players.length
          : match.teamC?.players.length ?? 0;
    const targetPlayers = getDraftTeam(targetTeam);
    if (targetPlayers.length >= targetCapacity) {
      setError(`Team ${teamLabel(targetTeam)} is full (${targetCapacity}). Return someone first.`);
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
    setDraftTeamC((current) =>
      targetTeam === 'c' ? [...without(current), player] : without(current),
    );
    setError('');
  }

  function fillRestOfTeams() {
    if (!match) return;
    try {
      const all = [...draftTeamA, ...draftTeamB, ...draftTeamC, ...draftPool];

      if (isThreeTeamMatch(match) && match.teamC) {
        const result = generateBalancedThreeTeamsWithLocks(
          all,
          match.teamA.players.length,
          match.teamB.players.length,
          match.teamC.players.length,
          {
            teamA: draftTeamA.map((player) => player.id),
            teamB: draftTeamB.map((player) => player.id),
            teamC: draftTeamC.map((player) => player.id),
          },
        );
        setDraftTeamA(result.teamA.players);
        setDraftTeamB(result.teamB.players);
        setDraftTeamC(result.teamC.players);
      } else {
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
      }

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
    const teamCCapacity = match.teamC?.players.length ?? 0;
    const threeWay = isThreeTeamMatch(match);

    if (
      draftTeamA.length !== teamACapacity ||
      draftTeamB.length !== teamBCapacity ||
      (threeWay && draftTeamC.length !== teamCCapacity) ||
      draftPool.length > 0
    ) {
      setError(`Assign all players first (${getMatchLabel(match)}).`);
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
        threeWay ? draftTeamC.map((player) => player.id) : undefined,
        threeWay
          ? {
              teamA: sanitizeTeamName(draftTeamAName, DEFAULT_TEAM_NAMES.a),
              teamB: sanitizeTeamName(draftTeamBName, DEFAULT_TEAM_NAMES.b),
              teamC: sanitizeTeamName(draftTeamCName, DEFAULT_TEAM_NAMES.c),
            }
          : undefined,
      );
      setMatch(updated);
      setEditing(false);
      setEditTab(isThreeTeamMatch(match) ? 'lock' : 'swap');
      setDraftTeamA([]);
      setDraftTeamB([]);
      setDraftTeamC([]);
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

  const threeWay = isThreeTeamMatch(match);
  const matchLabel = getMatchLabel(match);
  const displayTitle = (match.name ?? '').trim() || `${matchLabel} lineup`;
  const teamsComplete =
    draftTeamA.length === match.teamA.players.length &&
    draftTeamB.length === match.teamB.players.length &&
    (!threeWay || draftTeamC.length === (match.teamC?.players.length ?? 0)) &&
    draftPool.length === 0;
  const displayedMatch =
    editing && teamsComplete
      ? {
          ...match,
          teamA: buildGeneratedTeam(
            sanitizeTeamName(draftTeamAName, DEFAULT_TEAM_NAMES.a),
            draftTeamA,
          ),
          teamB: buildGeneratedTeam(
            sanitizeTeamName(draftTeamBName, DEFAULT_TEAM_NAMES.b),
            draftTeamB,
          ),
          ...(threeWay
            ? {
                teamC: buildGeneratedTeam(
                  sanitizeTeamName(draftTeamCName, DEFAULT_TEAM_NAMES.c),
                  draftTeamC,
                ),
              }
            : {}),
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
            {match.recordedAsPlayed ? (
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Counted as played
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <label className="btn-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-elite-600 focus:ring-elite-500"
                checked={Boolean(match.recordedAsPlayed)}
                disabled={recording || editing || renamingTeams || shuffling}
                onChange={(e) => void handleRecordToggle(e.target.checked)}
              />
              {recording ? 'Saving…' : 'Count as played'}
            </label>
          ) : null}
          <button
            type="button"
            className="btn-secondary"
            disabled={editing || renamingTeams || shuffling || sharing}
            onClick={startRenamingTeams}
          >
            <Tag className="h-4 w-4" />
            Rename teams
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={editing || renamingTeams || shuffling || sharing}
            onClick={startEditing}
          >
            <Pencil className="h-4 w-4" />
            Edit teams
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={editing || renamingTeams || shuffling || sharing}
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
            disabled={editing || renamingTeams || sharing || shuffling}
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
          <Link to={`/${slug}/games-played`} className="btn-secondary">
            Games played
          </Link>
          <Link to={`/${slug}/history`} className="btn-secondary">
            History
          </Link>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Edit teams moves players. Rename teams changes labels only. Shuffle again opens a separate
        lineup link.
        {isAdmin
          ? ' Check “Count as played” after the game so player games-played totals update.'
          : ''}
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {renamingTeams ? (
        <TeamNameEditor
          teamCount={threeWay ? 3 : 2}
          teamAName={draftTeamAName}
          teamBName={draftTeamBName}
          teamCName={draftTeamCName}
          onTeamANameChange={setDraftTeamAName}
          onTeamBNameChange={setDraftTeamBName}
          onTeamCNameChange={setDraftTeamCName}
          busy={saving}
          onSave={saveRenamedTeams}
          onCancel={cancelRenamingTeams}
        />
      ) : null}

      {editing ? (
        <TeamEditor
          tab={editTab}
          onTabChange={switchEditTab}
          teamCount={threeWay ? 3 : 2}
          teamAPlayers={draftTeamA}
          teamBPlayers={draftTeamB}
          teamCPlayers={draftTeamC}
          poolPlayers={draftPool}
          teamAName={draftTeamAName}
          teamBName={draftTeamBName}
          teamCName={draftTeamCName}
          onTeamNameChange={updateDraftTeamName}
          teamACapacity={match.teamA.players.length}
          teamBCapacity={match.teamB.players.length}
          teamCCapacity={match.teamC?.players.length ?? 0}
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

      {editing && !teamsComplete && editTab !== 'swap' ? (
        <p className="text-sm text-slate-500">
          Lineup preview updates once all teams are fully assigned.
        </p>
      ) : renamingTeams ? null : threeWay ? (
        <ThreeTeamMatchView
          pitchCaptureRef={pitchCaptureRef}
          match={displayedMatch}
          roster={players}
        />
      ) : (
        <PitchView pitchCaptureRef={pitchCaptureRef} match={displayedMatch} roster={players} />
      )}
    </div>
  );
}
