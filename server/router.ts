import type { VercelRequest, VercelResponse } from '@vercel/node';
import adminLogin from './handlers/admin-login.js';
import adminGroups from './handlers/admin-groups.js';
import adminGroupPlayers from './handlers/admin-group-players.js';
import adminGroupUpload from './handlers/admin-group-upload.js';
import groupsList from './handlers/groups-list.js';
import groupDetail from './handlers/group-detail.js';
import groupMatches from './handlers/group-matches.js';
import groupMatchDetail from './handlers/group-match-detail.js';
import groupImage from './handlers/group-image.js';
import cronPurgeMatches from './handlers/cron-purge-matches.js';
import { error } from './lib/auth.js';

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>;

type Route = {
  method: string;
  regex: RegExp;
  handler: Handler;
  params: string[];
};

const routes: Route[] = [
  { method: 'POST', regex: /^\/api\/admin\/login$/, handler: adminLogin, params: [] },
  { method: 'GET', regex: /^\/api\/admin\/groups$/, handler: adminGroups, params: [] },
  { method: 'POST', regex: /^\/api\/admin\/groups$/, handler: adminGroups, params: [] },
  { method: 'GET', regex: /^\/api\/groups$/, handler: groupsList, params: [] },
  { method: 'GET', regex: /^\/api\/groups\/([^/]+)$/, handler: groupDetail, params: ['slug'] },
  {
    method: 'GET',
    regex: /^\/api\/groups\/([^/]+)\/matches\/([^/]+)$/,
    handler: groupMatchDetail,
    params: ['slug', 'matchId'],
  },
  {
    method: 'PUT',
    regex: /^\/api\/groups\/([^/]+)\/matches\/([^/]+)$/,
    handler: groupMatchDetail,
    params: ['slug', 'matchId'],
  },
  {
    method: 'GET',
    regex: /^\/api\/groups\/([^/]+)\/matches$/,
    handler: groupMatches,
    params: ['slug'],
  },
  {
    method: 'POST',
    regex: /^\/api\/groups\/([^/]+)\/matches$/,
    handler: groupMatches,
    params: ['slug'],
  },
  {
    method: 'GET',
    regex: /^\/api\/admin\/groups\/([^/]+)\/players$/,
    handler: adminGroupPlayers,
    params: ['slug'],
  },
  {
    method: 'POST',
    regex: /^\/api\/admin\/groups\/([^/]+)\/players$/,
    handler: adminGroupPlayers,
    params: ['slug'],
  },
  {
    method: 'PUT',
    regex: /^\/api\/admin\/groups\/([^/]+)\/players$/,
    handler: adminGroupPlayers,
    params: ['slug'],
  },
  {
    method: 'DELETE',
    regex: /^\/api\/admin\/groups\/([^/]+)\/players$/,
    handler: adminGroupPlayers,
    params: ['slug'],
  },
  {
    method: 'POST',
    regex: /^\/api\/admin\/groups\/([^/]+)\/upload$/,
    handler: adminGroupUpload,
    params: ['slug'],
  },
  {
    method: 'GET',
    regex: /^\/api\/groups\/([^/]+)\/images\/([^/]+)$/,
    handler: groupImage,
    params: ['slug', 'file'],
  },
  {
    method: 'GET',
    regex: /^\/api\/cron\/purge-matches$/,
    handler: cronPurgeMatches,
    params: [],
  },
];

export function matchApiRoute(pathname: string, method: string) {
  for (const route of routes) {
    const match = pathname.match(route.regex);
    if (!match || method !== route.method) continue;

    const query: Record<string, string | string[]> = {};
    route.params.forEach((param, index) => {
      query[param] = match[index + 1]!;
    });

    return { handler: route.handler, query };
  }

  return null;
}

export async function dispatchApiRequest(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const route = matchApiRoute(url.pathname, req.method ?? 'GET');
  if (!route) {
    return error(res, 404, 'Not found');
  }

  url.searchParams.forEach((value, key) => {
    route.query[key] = value;
  });
  req.query = { ...req.query, ...route.query };

  await route.handler(req, res);
}
