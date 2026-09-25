import { Link } from 'react-router-dom';
import { TeamLogo } from '@/components/TeamLogo';

export function GroupPageHeading({
  slug,
  groupName,
  title,
  children,
}: {
  slug: string;
  groupName?: string;
  title: string;
  children?: React.ReactNode;
}) {
  const name = groupName || slug;

  return (
    <div className="flex items-start gap-3">
      <TeamLogo slug={slug} name={name} className="h-12 w-12" />
      <div>
        <p className="text-sm text-slate-500">
          <Link to={`/${slug}`} className="text-elite-700 hover:underline">
            {name}
          </Link>
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900">{title}</h1>
        {children}
      </div>
    </div>
  );
}
