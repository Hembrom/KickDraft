import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { GROUND_VENUES } from '@shared/ground-bookings';

function VenueCardImage({ imageUrl, name, location }: { imageUrl: string; name: string; location: string }) {
  return (
    <img
      src={imageUrl}
      alt={`${name}, ${location}`}
      className="h-full w-full object-cover"
    />
  );
}

export function GroundBookingPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-elite-600">Venues</p>
        <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">Book a ground</h1>
        <p className="max-w-2xl text-slate-600">
          Tap a venue for booking steps, links, and what you need to know before you play.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {GROUND_VENUES.map((venue) => (
          <Link
            key={venue.id}
            to={`/grounds/${venue.id}`}
            className="card group overflow-hidden p-0 transition hover:shadow-md"
          >
            <div className="aspect-[5/3] overflow-hidden bg-slate-100">
              <VenueCardImage
                imageUrl={venue.imageUrl}
                name={venue.name}
                location={venue.location}
              />
            </div>
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold text-slate-900">{venue.name}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="h-4 w-4 shrink-0 text-elite-500" />
                  <span className="line-clamp-2">{venue.location}</span>
                </p>
                {venue.priceHint ? (
                  <p className="mt-1 text-xs font-medium text-emerald-700">{venue.priceHint}</p>
                ) : null}
                {venue.grounds && venue.grounds.length > 0 ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {venue.grounds.length} grounds · {venue.grounds.map((g) => g.name).join(' · ')}
                  </p>
                ) : venue.pitchInfo ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {venue.pitchInfo.dimensions} · Best for {venue.pitchInfo.formatRatings[0]?.format}
                  </p>
                ) : null}
              </div>
              <span className="btn-secondary shrink-0 px-3 py-2 text-xs group-hover:border-elite-300 group-hover:text-elite-700">
                How to book <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
