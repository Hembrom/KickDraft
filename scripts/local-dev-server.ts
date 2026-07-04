import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { readFile as readFileAsync } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveLocalFilePath } from '../api/lib/local-storage.js';

function loadEnvFile(filePath: string) {
  try {
    const content = readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional env file
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

type Handler = (req: VercelRequest, res: VercelResponse) => unknown;

const routes: Array<{ method: string; regex: RegExp; file: string; params: string[] }> = [
  { method: 'POST', regex: /^\/api\/admin\/login$/, file: 'api/admin/login.ts', params: [] },
  { method: 'GET', regex: /^\/api\/admin\/groups$/, file: 'api/admin/groups/index.ts', params: [] },
  { method: 'POST', regex: /^\/api\/admin\/groups$/, file: 'api/admin/groups/index.ts', params: [] },
  { method: 'GET', regex: /^\/api\/groups$/, file: 'api/groups/index.ts', params: [] },
  {
    method: 'GET',
    regex: /^\/api\/groups\/([^/]+)$/,
    file: 'api/groups/[slug].ts',
    params: ['slug'],
  },
  {
    method: 'GET',
    regex: /^\/api\/groups\/([^/]+)\/matches$/,
    file: 'api/groups/[slug]/matches.ts',
    params: ['slug'],
  },
  {
    method: 'POST',
    regex: /^\/api\/groups\/([^/]+)\/matches$/,
    file: 'api/groups/[slug]/matches.ts',
    params: ['slug'],
  },
  {
    method: 'GET',
    regex: /^\/api\/admin\/groups\/([^/]+)\/players$/,
    file: 'api/admin/groups/[slug]/players.ts',
    params: ['slug'],
  },
  {
    method: 'POST',
    regex: /^\/api\/admin\/groups\/([^/]+)\/players$/,
    file: 'api/admin/groups/[slug]/players.ts',
    params: ['slug'],
  },
  {
    method: 'PUT',
    regex: /^\/api\/admin\/groups\/([^/]+)\/players$/,
    file: 'api/admin/groups/[slug]/players.ts',
    params: ['slug'],
  },
  {
    method: 'DELETE',
    regex: /^\/api\/admin\/groups\/([^/]+)\/players$/,
    file: 'api/admin/groups/[slug]/players.ts',
    params: ['slug'],
  },
  {
    method: 'POST',
    regex: /^\/api\/admin\/groups\/([^/]+)\/upload$/,
    file: 'api/admin/groups/[slug]/upload.ts',
    params: ['slug'],
  },
  {
    method: 'GET',
    regex: /^\/api\/cron\/purge-matches$/,
    file: 'api/cron/purge-matches.ts',
    params: [],
  },
];

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function createVercelResponse(res: ServerResponse): VercelResponse {
  return {
    status(code: number) {
      res.statusCode = code;
      return this;
    },
    json(data: unknown) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return this;
    },
    end(data?: string) {
      res.end(data);
      return this;
    },
    setHeader(name: string, value: string) {
      res.setHeader(name, value);
      return this;
    },
  } as VercelResponse;
}

async function invokeHandler(
  modulePath: string,
  req: IncomingMessage,
  res: ServerResponse,
  query: Record<string, string | string[]>,
) {
  const mod = await import(pathToFileURL(modulePath).href);
  const handler = mod.default as Handler;
  const body = await readBody(req);
  const vercelReq = Object.assign(req, {
    query,
    body,
    cookies: {},
  }) as VercelRequest;

  await handler(vercelReq, createVercelResponse(res));
}

function matchRoute(url: string, method: string) {
  const pathname = new URL(url, 'http://localhost').pathname;

  if (pathname.startsWith('/api/local-files/')) {
    return { type: 'file' as const, relative: pathname.replace('/api/local-files/', '') };
  }

  const urlObj = new URL(url, 'http://localhost');
  for (const route of routes) {
    const match = pathname.match(route.regex);
    if (!match || method !== route.method) continue;

    const query: Record<string, string | string[]> = {};
    route.params.forEach((param, index) => {
      query[param] = match[index + 1];
    });
    urlObj.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    return {
      type: 'handler' as const,
      file: path.join(process.cwd(), route.file),
      query,
    };
  }

  return null;
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = req.url ?? '/';
  const method = req.method ?? 'GET';
  const route = matchRoute(url, method);

  if (!route) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  if (route.type === 'file') {
    const filePath = resolveLocalFilePath(route.relative);
    if (!filePath) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }
    try {
      const data = await readFileAsync(filePath);
      const ext = path.extname(filePath).slice(1);
      const types: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
      };
      res.setHeader('Content-Type', types[ext] ?? 'application/octet-stream');
      res.end(data);
    } catch {
      res.statusCode = 404;
      res.end('Not found');
    }
    return;
  }

  try {
    await invokeHandler(route.file, req, res, route.query);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

const PORT = Number(process.env.PORT ?? 3000);
server.listen(PORT, () => {
  const mode =
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID
      ? 'Vercel Blob'
      : 'local .local-data folder';
  console.log(`SquadBalance API running at http://localhost:${PORT} (${mode})`);
});
