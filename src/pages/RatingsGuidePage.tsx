import { Link } from 'react-router-dom';
import { ArrowRight, Clock, LogIn, SlidersHorizontal, UserCheck, Users } from 'lucide-react';

const APP_URL = 'https://kick-draft.vercel.app';
const GUIDE_URL = `${APP_URL}/guide/rate`;
const NEWTOWN_SLUG = 'newtown-sporting-club';
const NEWTOWN_URL = `${APP_URL}/${NEWTOWN_SLUG}`;
const CLAIM_URL = `${NEWTOWN_URL}/claim`;
const RATE_URL = `${NEWTOWN_URL}/rate`;
const REVIEWS_URL = `${NEWTOWN_URL}/reviews`;

export function RatingsGuidePage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8 pb-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-elite-600">
          For players
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
          How to rate players
        </h1>
        <p className="text-slate-600">
          Sign in → claim your card once → rate teammates. A card&apos;s public OVR is the
          average of those ratings, and that is what the app uses to split fair teams.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to={`/${NEWTOWN_SLUG}/claim`} className="btn-primary inline-flex">
            Claim your player <ArrowRight className="h-4 w-4" />
          </Link>
          <a href={GUIDE_URL} className="btn-secondary inline-flex text-sm">
            {GUIDE_URL}
          </a>
        </div>
      </header>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">How the score works</h2>
        <p className="text-sm text-slate-600">
          Every rating uses seven sliders. Each one is <strong>25–95</strong>:
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>
            <strong>Pace, Shooting, Passing, Dribbling, Defending, Physicality, Stamina</strong>
          </li>
          <li>
            <strong>Your rating OVR</strong> — average of those seven numbers (rounded)
          </li>
          <li>
            <strong>A player&apos;s squad OVR</strong> — average of every teammate rating they
            have received (each stat averaged first, then OVR)
          </li>
          <li>
            <strong>Unrated</strong> — nobody has rated them yet. No peer OVR until the first
            rating lands
          </li>
          <li>You cannot rate yourself. Your own card is hidden from your list</li>
        </ul>
      </section>

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
          . Tap <strong>Claim / rate</strong>.
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">2 · Sign in with Google</h2>
        <p className="flex items-start gap-2 text-sm text-slate-600">
          <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-elite-600" />
          <span>
            Tap <strong>Continue with Google</strong>. The same Google account is how the app
            knows who you are.
          </span>
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">3 · Claim your player (once)</h2>
        <p className="flex items-start gap-2 text-sm text-slate-600">
          <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-elite-600" />
          <span>
            Tap <strong>your</strong> card, then confirm. Claiming is permanent.
          </span>
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>
            <strong>One Google account = one player, forever</strong>
          </li>
          <li>
            <strong>One player = one owner</strong> — if that card is taken, pick another
          </li>
          <li>You cannot switch later yourself</li>
          <li>
            If you already claimed in another group, you stay with that player — claiming is
            global, not per group
          </li>
        </ul>
        <p className="text-sm text-slate-600">
          Direct link:{' '}
          <a href={CLAIM_URL} className="break-all font-medium text-elite-600">
            {CLAIM_URL}
          </a>
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">4 · Rate teammates</h2>
        <p className="flex items-start gap-2 text-sm text-slate-600">
          <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-elite-600" />
          <span>
            On <strong>Rate teammates</strong>, tap <strong>Rate</strong> on a player. Move the
            seven sliders, then <strong>Save</strong>.
          </span>
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Sliders start at 50 if you have never rated them</li>
          <li>
            If you rated them before and the wait is over, <strong>Update</strong> re-opens
            your last scores
          </li>
          <li>You can rate as many different teammates as you like</li>
        </ul>
        <p className="text-sm text-slate-600">
          Direct link:{' '}
          <a href={RATE_URL} className="break-all font-medium text-elite-600">
            {RATE_URL}
          </a>
        </p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">5 · Two-week wait to rate the same person again</h2>
        <p className="flex items-start gap-2 text-sm text-slate-600">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-elite-600" />
          <span>
            After you save a rating for someone, you <strong>cannot change it for 14 days</strong>.
            The page shows <strong>Again in X days</strong>.
          </span>
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>The 14 days start from your last save for that teammate</li>
          <li>Other teammates can still be rated immediately</li>
          <li>
            When the wait ends, tap <strong>Update</strong> and save a new score
          </li>
        </ul>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">Who rated whom</h2>
        <p className="flex items-start gap-2 text-sm text-slate-600">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-elite-600" />
          <span>
            Anyone can open <strong>Who rated whom</strong> — no login. It lists ratings from
            the <strong>last 30 days</strong>, up to <strong>2 rows</strong> per rater → rated
            pair.
          </span>
        </p>
        <p className="text-sm text-slate-600">
          <a href={REVIEWS_URL} className="break-all font-medium text-elite-600">
            {REVIEWS_URL}
          </a>
        </p>
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="font-display text-lg font-bold">Quick tips</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Claim the real you — it is permanent</li>
          <li>Be honest; peer averages drive team balance</li>
          <li>Unrated cards stay Unrated until the first teammate rates them</li>
          <li>
            A captain / super admin can unclaim a wrong card. Past ratings that person gave
            stay in the system
          </li>
          <li>
            Super admin can remove a rating; that pair can rate again immediately
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to={`/${NEWTOWN_SLUG}/claim`} className="btn-primary">
          Claim your player
        </Link>
        <Link to="/guide" className="btn-secondary">
          Captain&apos;s guide
        </Link>
        <Link to="/" className="btn-secondary">
          Back home
        </Link>
      </div>
    </article>
  );
}
