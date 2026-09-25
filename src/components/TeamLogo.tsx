import { useEffect, useState } from 'react';
import { groupInitials, groupLogoUrl } from '@shared/group-logo';
import { cn } from '@/lib/utils';

export function TeamLogo({
  slug,
  name,
  version,
  className,
  textClassName,
}: {
  slug: string;
  name: string;
  version?: number | string;
  className?: string;
  textClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = groupLogoUrl(slug, version);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!slug || failed) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-2xl bg-elite-50 font-display font-bold text-elite-700 ring-1 ring-elite-100',
          className,
        )}
        aria-hidden
      >
        <span className={cn('text-sm', textClassName)}>{groupInitials(name || slug)}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={cn('shrink-0 rounded-2xl bg-white object-cover ring-1 ring-slate-200', className)}
      onError={() => setFailed(true)}
    />
  );
}
