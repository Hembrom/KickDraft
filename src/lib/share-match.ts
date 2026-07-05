import { toPng } from 'html-to-image';
import { formatDate } from '@/lib/utils';
import { getMatchSizeLabel, type MatchRecord } from '@shared/types';

export function buildShareCaption(match: MatchRecord, url: string): string {
  const sizeLabel = getMatchSizeLabel(match.teamA.players.length, match.teamB.players.length);
  const title = (match.name ?? '').trim() || `${sizeLabel} lineup`;
  return `${title}\n${sizeLabel} · ${formatDate(match.date)}\n${url}`;
}

export async function captureLineupImage(element: HTMLElement): Promise<File | null> {
  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: Math.min(window.devicePixelRatio || 2, 2),
      backgroundColor: '#ffffff',
    });
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], 'lineup.png', { type: 'image/png' });
  } catch {
    return null;
  }
}

export async function shareMatchLineup(options: {
  match: MatchRecord;
  groupName: string;
  captureEl: HTMLElement | null;
}): Promise<'shared' | 'copied' | 'cancelled'> {
  const url = window.location.href;
  const caption = buildShareCaption(options.match, url);
  const title = (options.match.name ?? '').trim() || options.groupName;

  const imageFile = options.captureEl ? await captureLineupImage(options.captureEl) : null;

  if (typeof navigator.share === 'function') {
    const base: ShareData = { title, text: caption };

    if (imageFile) {
      const withImage: ShareData = { ...base, files: [imageFile] };
      if (navigator.canShare?.(withImage) !== false) {
        try {
          await navigator.share(withImage);
          return 'shared';
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
        }
      }
    }

    try {
      await navigator.share(base);
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
      throw err;
    }
  }

  await navigator.clipboard.writeText(caption);
  return 'copied';
}
