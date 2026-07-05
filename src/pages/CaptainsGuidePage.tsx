import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const APP_URL = 'https://kick-draft.vercel.app';

export function CaptainsGuidePage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8 pb-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-elite-600">
          For captains
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
          How to make teams in 5 minutes
        </h1>
        <p className="text-slate-600">
          Pick who played today → balanced sides → share on WhatsApp. No random picks — you
          choose the squad.
        </p>
        <a href={APP_URL} className="btn-primary inline-flex">
          Open SquadBalance <ArrowRight className="h-4 w-4" />
        </a>
      </header>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">1 · Open your squad</h2>
        <p className="text-sm text-slate-600">
          Go to <a href={APP_URL} className="font-medium text-elite-600">{APP_URL}</a> and open
          your club (e.g. Newtown Sporting Club).
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">2 · Name the match</h2>
        <p className="text-sm text-slate-600">
          Type a short label — e.g. <strong>July 7 - Suresh</strong>. This appears when you share
          the lineup.
        </p>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-lg font-bold">3 · Tick who showed up</h2>
        <p className="text-sm text-slate-600">
          Under <strong>Today&apos;s availability</strong>, tap the checkbox for each player.
          Only selected players are used — nobody is picked at random.
        </p>
        <figure className="overflow-hidden rounded-xl border border-slate-200">
          <img
            src="/guide/select-players.png"
            alt="Selecting players with checkboxes"
            className="w-full"
          />
          <figcaption className="bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
            Tick everyone who is playing today
          </figcaption>
        </figure>
        <p className="text-sm text-slate-600">
          <strong>Size is automatic:</strong> 10 players → 5v5 · 11 → 6v5 · 12 → 6v6
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">4 · Balance teams</h2>
        <p className="text-sm text-slate-600">
          Tap <strong>Balance teams</strong>. The app splits your selection into two fair sides by
          rating and position.
        </p>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-lg font-bold">5 · Check the lineup</h2>
        <p className="text-sm text-slate-600">
          You get a pitch view — Team A vs Team B with formation (e.g. 5v5 = 1-2-2).
        </p>
        <figure className="overflow-hidden rounded-xl border border-slate-200">
          <img
            src="/guide/match-lineup.png"
            alt="Balanced teams on the pitch"
            className="w-full"
          />
          <figcaption className="bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
            Balanced teams on the pitch
          </figcaption>
        </figure>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-lg font-bold">6 · Share on WhatsApp</h2>
        <p className="text-sm text-slate-600">
          Tap <strong>Share match</strong>. You get:
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>A <strong>pitch screenshot</strong> (teams on the ground)</li>
          <li>A <strong>caption</strong> with match name, size, and one link</li>
        </ul>
        <figure className="overflow-hidden rounded-xl border border-slate-200">
          <img
            src="/guide/mobile-pitch.png"
            alt="Mobile pitch view shared as image"
            className="w-full"
          />
          <figcaption className="bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
            Share image — pitch + players only
          </figcaption>
        </figure>
        <div className="rounded-lg bg-slate-100 p-3 font-mono text-xs leading-relaxed text-slate-700">
          July 7 - Suresh
          <br />
          5v5 · 5 Jul 2026, 13:01
          <br />
          https://kick-draft.vercel.app/your-club/match/...
        </div>
        <p className="text-xs text-slate-500">
          Anyone with the link can view the lineup for 30 days.
        </p>
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="font-display text-lg font-bold">Quick tips</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Need 9–22 players selected for a match</li>
          <li>Tap a player on the pitch to see their stats card</li>
          <li>Match history keeps lineups from the last 30 days</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <a href={APP_URL} className="btn-primary">
          Start a match
        </a>
        <Link to="/" className="btn-secondary">
          Back home
        </Link>
      </div>
    </article>
  );
}
