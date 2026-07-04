import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { readFile as readFileAsync } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dispatchApiRequest } from '../server/router.js';
import { resolveLocalFilePath } from '../server/lib/local-storage.js';

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
    end(data?: string | Buffer) {
      res.end(data);
      return this;
    },
    setHeader(name: string, value: string | number | readonly string[]) {
      res.setHeader(name, value);
      return this;
    },
  } as VercelResponse;
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
  const pathname = new URL(url, 'http://localhost').pathname;

  if (pathname.startsWith('/api/local-files/')) {
    const relative = pathname.replace('/api/local-files/', '');
    const filePath = resolveLocalFilePath(relative);
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
    const body = await readBody(req);
    const vercelReq = Object.assign(req, {
      body,
      cookies: {},
      url,
    }) as VercelRequest;

    await dispatchApiRequest(vercelReq, createVercelResponse(res));
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
