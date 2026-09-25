import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GroupPageHeading } from '@/components/GroupPageHeading';
import { PublicPeerReviewsPanel } from '@/components/PublicPeerReviewsPanel';
import { api, ApiError } from '@/lib/api';

export function PeerReviewsPage() {
  const { slug = '' } = useParams();
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api
      .getGroup(slug)
      .then((data) => setGroupName(data.name))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load group');
      });
  }, [slug]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <GroupPageHeading slug={slug} groupName={groupName} title="Who rated whom">
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Public peer reviews — no login required.
          </p>
        </GroupPageHeading>
        <div className="flex flex-wrap gap-2">
          <Link to={`/${slug}/claim`} className="btn-secondary">
            Claim player
          </Link>
          <Link to={`/${slug}`} className="btn-secondary">
            Squad
          </Link>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <PublicPeerReviewsPanel slug={slug} />
    </div>
  );
}
