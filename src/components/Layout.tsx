/**
 * Layout entry — thin re-export so App.tsx (and any pages) keep using Layout.
 * The real chrome lives in ./shell (responsive app shell).
 */
export { AppShell as Layout } from './shell/AppShell';
