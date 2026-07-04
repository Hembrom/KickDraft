import { FOOTBALL_CLUBS, getClubById, type FootballClub } from '@shared/clubs';

interface ClubSelectProps {
  value: string;
  onChange: (clubId: string) => void;
}

export function ClubSelect({ value, onChange }: ClubSelectProps) {
  const selected = getClubById(value);

  return (
    <div className="space-y-2">
      <select
        id="favourite-club"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select favourite club</option>
        {FOOTBALL_CLUBS.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name} · {club.league}
          </option>
        ))}
      </select>

      {selected ? <ClubPreview club={selected} /> : null}
    </div>
  );
}

function ClubPreview({ club }: { club: FootballClub }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-elite-50/60 px-3 py-2">
      <img
        src={club.logo}
        alt={club.name}
        className="h-10 w-10 object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <div>
        <p className="text-sm font-semibold text-slate-900">{club.name}</p>
        <p className="text-xs text-slate-500">{club.league}</p>
      </div>
    </div>
  );
}
