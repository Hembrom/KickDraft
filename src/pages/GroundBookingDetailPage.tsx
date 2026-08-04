import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import {
  getGroundVenue,
  telUrl,
  whatsappUrl,
} from '@shared/ground-bookings';

function VenueHero({ imageUrl, name, location, className }: {
  imageUrl: string;
  name: string;
  location: string;
  className?: string;
}) {
  return (
    <img
      src={imageUrl}
      alt={`${name}, ${location}`}
      className={`object-cover ${className ?? ''}`}
    />
  );
}

function StarRating({ count }: { count: number }) {
  return (
    <span className="text-amber-500" aria-label={`${count} out of 5 stars`}>
      {'★'.repeat(count)}
      <span className="text-slate-300">{'★'.repeat(5 - count)}</span>
    </span>
  );
}

export function GroundBookingDetailPage() {
  const { groundId = '' } = useParams();
  const venue = getGroundVenue(groundId);
  const [copied, setCopied] = useState(false);

  if (!venue) {
    return <Navigate to="/grounds" replace />;
  }

  const isOnline = venue.bookingMethod === 'online';
  const waLink =
    venue.whatsappNumber && venue.sampleMessage
      ? whatsappUrl(venue.whatsappNumber, venue.sampleMessage)
      : venue.whatsappNumber
        ? whatsappUrl(venue.whatsappNumber, `Hi, I have a question about booking ${venue.name}.`)
        : null;
  const phoneLink = venue.whatsappNumber ? telUrl(venue.whatsappNumber) : null;
  const callContacts =
    venue.phoneContacts && venue.phoneContacts.length > 0
      ? venue.phoneContacts
      : venue.phoneDisplay && venue.whatsappNumber
        ? [{ display: venue.phoneDisplay, number: venue.whatsappNumber }]
        : [];
  const bookOnlineLabel = venue.bookingSiteLabel
    ? `Book on ${venue.bookingSiteLabel}`
    : 'Book online (full payment)';

  async function copyMessage() {
    if (!venue?.sampleMessage) return;
    try {
      await navigator.clipboard.writeText(venue.sampleMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="mx-auto max-w-2xl space-y-5 pb-10">
      <Link to="/grounds" className="btn-secondary inline-flex text-sm">
        <ArrowLeft className="h-4 w-4" /> All grounds
      </Link>

      <div className="card overflow-hidden p-0">
        <div className="aspect-[16/9] overflow-hidden bg-slate-100">
          <VenueHero
            imageUrl={venue.imageUrl}
            name={venue.name}
            location={venue.location}
            className="h-full w-full"
          />
        </div>
        <div className="space-y-3 p-5">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">{venue.name}</h1>
            {venue.priceHint ? (
              <p className="mt-1 text-sm font-medium text-emerald-700">{venue.priceHint}</p>
            ) : null}
            <a
              href={venue.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-elite-600 hover:underline"
            >
              <MapPin className="h-4 w-4 shrink-0" />
              {venue.location} · Google Maps
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {venue.openingHours ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                <Clock className="h-4 w-4 shrink-0 text-elite-500" />
                {venue.openingHours}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {isOnline && venue.bookingUrl ? (
              <a
                href={venue.bookingUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full justify-center py-3 sm:col-span-2"
              >
                <CalendarCheck className="h-5 w-5" />
                {bookOnlineLabel}
              </a>
            ) : null}
            {waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className={`btn-${isOnline ? 'secondary' : 'primary'} w-full justify-center py-3`}
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </a>
            ) : null}
            {callContacts.map((contact) => (
              <a
                key={contact.number}
                href={telUrl(contact.number)}
                className="btn-secondary w-full justify-center py-3"
              >
                <Phone className="h-5 w-5" />
                Call {contact.display}
              </a>
            ))}
            {!callContacts.length && phoneLink && venue.phoneDisplay ? (
              <a href={phoneLink} className="btn-secondary w-full justify-center py-3">
                <Phone className="h-5 w-5" />
                Call {venue.phoneDisplay}
              </a>
            ) : null}
            <a
              href={venue.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary w-full justify-center py-3"
            >
              <ExternalLink className="h-5 w-5" />
              Google Maps
            </a>
          </div>
        </div>
      </div>

      {venue.grounds && venue.grounds.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-900">Grounds &amp; pricing</h2>
          {venue.grounds.map((ground) => (
            <div key={ground.name} className="card space-y-4 p-5">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">{ground.name}</h3>
                {ground.description ? (
                  <p className="mt-1 text-sm text-slate-600">{ground.description}</p>
                ) : null}
                <p className="mt-1 text-sm font-semibold text-emerald-700">{ground.pricePerHour}</p>
              </div>
              {ground.dimensions ? (
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Playing dimensions
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {ground.dimensions}{' '}
                      {ground.dimensionsMetric ? (
                        <span className="font-normal text-slate-600">({ground.dimensionsMetric})</span>
                      ) : null}
                    </dd>
                    {ground.dimensionsNote ? (
                      <dd className="mt-1 text-xs text-slate-500">{ground.dimensionsNote}</dd>
                    ) : null}
                  </div>
                  {ground.playingArea ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Playing area
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-900">{ground.playingArea}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Best format
                </p>
                <ul className="space-y-2">
                  {ground.formatRatings.map((rating) => (
                    <li
                      key={rating.format}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <span className="font-semibold text-slate-900">{rating.format}</span>
                      <div className="flex items-center gap-2">
                        <StarRating count={rating.stars} />
                        {rating.note ? (
                          <span className="text-xs text-slate-500">{rating.note}</span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </section>
      ) : venue.pitchInfo ? (
        <section className="card space-y-4 p-5">
          <h2 className="font-display text-lg font-bold text-slate-900">Pitch size &amp; formats</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Playing dimensions
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {venue.pitchInfo.dimensions}{' '}
                <span className="font-normal text-slate-600">({venue.pitchInfo.dimensionsMetric})</span>
              </dd>
              {venue.pitchInfo.dimensionsNote ? (
                <dd className="mt-1 text-xs text-slate-500">{venue.pitchInfo.dimensionsNote}</dd>
              ) : null}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Playing area
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">{venue.pitchInfo.playingArea}</dd>
            </div>
          </dl>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Best format
            </p>
            <ul className="space-y-2">
              {venue.pitchInfo.formatRatings.map((rating) => (
                <li
                  key={rating.format}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
                >
                  <span className="font-semibold text-slate-900">{rating.format}</span>
                  <div className="flex items-center gap-2">
                    <StarRating count={rating.stars} />
                    {rating.note ? (
                      <span className="text-xs text-slate-500">{rating.note}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {venue.rateChart && venue.rateChart.length > 0 ? (
        <section className="card space-y-4 p-5">
          <h2 className="font-display text-lg font-bold text-slate-900">Rate chart</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {venue.rateChart.map((group) => (
              <div
                key={group.title}
                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80"
              >
                <p className="border-b border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                  {group.title}
                </p>
                <ul className="divide-y divide-slate-200">
                  {group.rows.map((row) => (
                    <li
                      key={`${group.title}-${row.label}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-600">{row.label}</span>
                      <span className="font-semibold text-emerald-700">{row.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-lg font-bold text-slate-900">How to book</h2>
        <ol className="space-y-3">
          {venue.steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm text-slate-700">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-elite-100 text-xs font-bold text-elite-700">
                {index + 1}
              </span>
              <span className="pt-0.5">
                {index === 0 && isOnline && venue.bookingUrl && venue.bookingSiteLabel === 'Rosedale Plaza' ? (
                  <>
                    Open{' '}
                    <a
                      href={venue.bookingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-elite-600 hover:underline"
                    >
                      Book online
                    </a>{' '}
                    on Rosedale Plaza — choose Football, pick your date, then select your time slot(s).
                  </>
                ) : index === 0 && waLink && venue.phoneDisplay ? (
                  <>
                    Tap{' '}
                    <a href={waLink} target="_blank" rel="noreferrer" className="font-semibold text-elite-600 hover:underline">
                      WhatsApp
                    </a>{' '}
                    or{' '}
                    <a href={phoneLink!} className="font-semibold text-elite-600 hover:underline">
                      call {venue.phoneDisplay}
                    </a>
                    .
                  </>
                ) : (
                  step
                )}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {venue.notes && venue.notes.length > 0 ? (
        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold text-slate-900">Good to know</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            {venue.notes.map((note) => (
              <li key={note} className="flex gap-2">
                <span className="text-elite-500">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {venue.cancellationPolicy ? (
        <section className="card space-y-2 p-5">
          <h2 className="font-display text-lg font-bold text-slate-900">Cancellation</h2>
          <p className="text-sm text-slate-700">{venue.cancellationPolicy}</p>
        </section>
      ) : null}

      {!isOnline && venue.sampleMessage ? (
        <section className="card space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-slate-900">Sample message</h2>
            <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={copyMessage}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <blockquote className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {venue.sampleMessage}
          </blockquote>
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex w-full justify-center sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" />
              Send on WhatsApp
            </a>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
