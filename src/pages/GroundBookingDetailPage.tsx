import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, ExternalLink, MapPin, MessageCircle, Phone } from 'lucide-react';
import {
  getGroundVenue,
  telUrl,
  whatsappUrl,
} from '@shared/ground-bookings';

export function GroundBookingDetailPage() {
  const { groundId = '' } = useParams();
  const venue = getGroundVenue(groundId);
  const [copied, setCopied] = useState(false);

  if (!venue) {
    return <Navigate to="/grounds" replace />;
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(venue!.sampleMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="mx-auto max-w-2xl space-y-6 pb-8">
      <Link to="/grounds" className="btn-secondary inline-flex text-sm">
        <ArrowLeft className="h-4 w-4" /> All grounds
      </Link>

      <div className="card overflow-hidden p-0">
        <div className="aspect-[16/9] bg-slate-100">
          <img
            src={venue.imageUrl}
            alt={`${venue.name}, ${venue.location}`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="space-y-1 p-5">
          <h1 className="font-display text-3xl font-bold text-slate-900">{venue.name}</h1>
          <p className="flex items-center gap-1.5 text-slate-600">
            <MapPin className="h-4 w-4 text-elite-500" />
            {venue.location}
          </p>
        </div>
      </div>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-lg font-bold text-slate-900">How to book</h2>
        <ol className="space-y-3">
          {venue.steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm text-slate-700">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-elite-100 text-xs font-bold text-elite-700">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-lg font-bold text-slate-900">Contact</h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={whatsappUrl(venue.whatsappNumber, venue.sampleMessage)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp {venue.phoneDisplay}
          </a>
          <a href={telUrl(venue.whatsappNumber)} className="btn-secondary">
            <Phone className="h-4 w-4" />
            Call {venue.phoneDisplay}
          </a>
          <a
            href={venue.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
          >
            <ExternalLink className="h-4 w-4" />
            Google Maps
          </a>
        </div>
      </section>

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
        <p className="text-xs text-slate-500">
          Edit the date, time, and ground size before you send. If they reply yes, you&apos;re done.
        </p>
      </section>
    </article>
  );
}
