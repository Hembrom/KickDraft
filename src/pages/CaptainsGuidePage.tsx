import { Link } from 'react-router-dom';
import { ArrowRight, Lock, Pencil, Shuffle, Wand2 } from 'lucide-react';

const APP_URL = 'https://kick-draft.vercel.app';
const GUIDE_URL = `${APP_URL}/guide`;
const NEWTOWN_SLUG = 'newtown-sporting-club';
const NEWTOWN_URL = `${APP_URL}/${NEWTOWN_SLUG}`;

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
          Pick who is coming → balanced sides → tweak if needed → share on WhatsApp. You choose
          the squad; the app balances OVR and stamina.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to={`/${NEWTOWN_SLUG}`} className="btn-primary inline-flex">
            Open Newtown Sporting Club <ArrowRight className="h-4 w-4" />
          </Link>
          <a href={GUIDE_URL} className="btn-secondary inline-flex text-sm">
            {GUIDE_URL}
          </a>
        </div>
      </header>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">1 · Open your squad</h2>
        <p className="text-sm text-slate-600">
          Go to{' '}
          <a href={NEWTOWN_URL} className="font-medium text-elite-600">
            Newtown Sporting Club
          </a>{' '}
          —{' '}
          <a href={NEWTOWN_URL} className="break-all font-medium text-elite-600">
            {NEWTOWN_URL}
          </a>
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
        <h2 className="font-display text-lg font-bold">3 · Tick who is coming</h2>
        <p className="text-sm text-slate-600">
          Under <strong>Today&apos;s availability</strong>, tap the checkbox for each player who
          is coming or will show up. Only selected players are used — nobody is picked at random.
        </p>
        <figure className="overflow-hidden rounded-xl border border-slate-200">
          <img
            src="/guide/select-players.png"
            alt="Newtown Sporting Club — tick checkboxes under Today's availability"
            className="w-full"
          />
          <figcaption className="bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
            Tick everyone who is coming or will show up
          </figcaption>
        </figure>
        <p className="text-sm text-slate-600">
          <strong>Size is automatic:</strong> 10 → 5v5 · 11 → 6v5 · 12 → 6v6 · 14 → 7v7
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">4 · Balance teams</h2>
        <p className="text-sm text-slate-600">
          Tap <strong>Balance teams</strong>. The app builds two fair sides using:
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>
            <strong>OVR</strong> — average of pace, shooting, passing, dribbling, defending,
            physicality, and <strong>stamina</strong>
          </li>
          <li>
            <strong>Stamina leaders</strong> — the top 4 stamina players in your selection are
            split <strong>2 per side</strong> so one team doesn&apos;t get all the engines
          </li>
          <li>
            <strong>Bookend draft</strong> (even sizes like 6v6, 7v7) — strong pairs and weak
            pairs alternate so low-rated players don&apos;t stack on one team
          </li>
          <li>
            <strong>Handicap</strong> (uneven sizes like 6v5, 7v6) — the smaller side gets a
            slight rating boost
          </li>
          <li>
            <strong>Goalkeepers</strong> — one keeper per side when possible
          </li>
        </ul>
        <p className="text-sm text-slate-600">
          Tap a player on the pitch to see their card — <strong>STA</strong> is stamina on the
          gold card.
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
        <h2 className="font-display text-lg font-bold">6 · Not happy? Shuffle or edit</h2>
        <p className="text-sm text-slate-600">
          On the match page you have two ways to try another split — without re-selecting
          everyone.
        </p>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-start gap-3">
            <Shuffle className="mt-0.5 h-5 w-5 shrink-0 text-elite-600" />
            <div>
              <p className="font-semibold text-slate-900">Shuffle again</p>
              <p className="text-sm text-slate-600">
                Same players, <strong>completely new teams</strong>, new link. Use this when you
                want a fresh auto-balance.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Pencil className="mt-0.5 h-5 w-5 shrink-0 text-elite-600" />
            <div>
              <p className="font-semibold text-slate-900">Edit teams</p>
              <p className="text-sm text-slate-600">
                Fine-tune the split yourself. Two modes:
              </p>
            </div>
          </div>

          <div className="ml-8 space-y-3 border-l-2 border-elite-200 pl-4">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Lock &amp; shuffle</p>
                <p className="text-sm text-slate-600">
                  Drag a few players onto Team A or B — e.g. keep mates together or fix a
                  keeper. Tap <strong>Fill rest of teams</strong>{' '}
                  <Wand2 className="inline h-3.5 w-3.5 text-slate-500" /> and the app randomly
                  balances everyone left (OVR + stamina rules still apply).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Pencil className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Manual</p>
                <p className="text-sm text-slate-600">
                  Assign <strong>every player yourself</strong> with the arrows or drag-and-drop.
                  Nothing is auto-filled. Save when both teams are full.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-lg font-bold">7 · Share on WhatsApp</h2>
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
          https://kick-draft.vercel.app/newtown-sporting-club/match/...
        </div>
        <p className="text-xs text-slate-500">
          Anyone with the link can view the lineup for 30 days.
        </p>
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="font-display text-lg font-bold">Quick tips</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Need 9–22 players selected for a match</li>
          <li>Stamina (STA) counts in OVR and in the top-4 stamina split</li>
          <li>Shuffle again = new teams; Edit teams = you control some or all placements</li>
          <li>Match history keeps lineups from the last 30 days</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to={`/${NEWTOWN_SLUG}`} className="btn-primary">
          Start a match
        </Link>
        <Link to="/" className="btn-secondary">
          Back home
        </Link>
      </div>
    </article>
  );
}
