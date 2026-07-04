import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'public/clubs');
const DELAY_MS = 1800;
const MAX_RETRIES = 4;

/** id -> list of fallback URLs (Wikimedia / Commons) */
const SOURCES = {
  'real-madrid': [
    'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  ],
  barcelona: [
    'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  ],
  'atletico-madrid': [
    'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/f/f4/Atletico_Madrid_2017_logo.svg',
  ],
  sevilla: ['https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg'],
  'manchester-united': [
    'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  ],
  'manchester-city': [
    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  ],
  liverpool: ['https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg'],
  chelsea: ['https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg'],
  arsenal: ['https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg'],
  tottenham: ['https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg'],
  newcastle: [
    'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
    'https://upload.wikimedia.org/wikipedia/en/4/43/Newcastle_United_Logo.svg',
  ],
  'aston-villa': [
    'https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_new_crest.svg',
    'https://upload.wikimedia.org/wikipedia/en/9/9a/Aston_Villa_FC_new_crest.svg',
  ],
  'west-ham': ['https://upload.wikimedia.org/wikipedia/en/c/c2/West_Ham_United_FC_logo.svg'],
  everton: ['https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg'],
  'bayern-munich': [
    'https://upload.wikimedia.org/wikipedia/commons/1/1f/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
    'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  ],
  'borussia-dortmund': [
    'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  ],
  psg: ['https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg'],
  marseille: [
    'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/4/43/Olympique_Marseille_logo.svg',
  ],
  juventus: [
    'https://upload.wikimedia.org/wikipedia/commons/a/a8/Juventus_FC_-_pictogram_black_%28Italy%2C_2017%29.svg',
    'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_icon.svg',
  ],
  'ac-milan': ['https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg'],
  'inter-milan': [
    'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  ],
  napoli: ['https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Neapel.svg'],
  roma: ['https://upload.wikimedia.org/wikipedia/en/f/f7/AS_Roma_logo_%282017%29.svg'],
  ajax: ['https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg'],
  benfica: ['https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg'],
  porto: ['https://upload.wikimedia.org/wikipedia/en/f/f1/FC_Porto.svg'],
  celtic: ['https://upload.wikimedia.org/wikipedia/en/3/35/Celtic_FC.svg'],
  rangers: ['https://upload.wikimedia.org/wikipedia/en/4/43/Rangers_FC.svg'],
  galatasaray: [
    'https://upload.wikimedia.org/wikipedia/en/2/20/Galatasaray_Sports_Club_Logo.svg',
  ],
  fenerbahce: [
    'https://upload.wikimedia.org/wikipedia/en/8/86/Fenerbah%C3%A7e_SK.png',
    'https://upload.wikimedia.org/wikipedia/commons/8/86/Fenerbah%C3%A7e_SK.png',
  ],
  'boca-juniors': [
    'https://upload.wikimedia.org/wikipedia/commons/8/89/Boca_Juniors_logo18.svg',
  ],
  'river-plate': ['https://upload.wikimedia.org/wikipedia/commons/7/73/River_Plate_logo.svg'],
  flamengo: ['https://upload.wikimedia.org/wikipedia/commons/2/2e/Flamengo_brazil_logo.svg'],
  corinthians: ['https://upload.wikimedia.org/wikipedia/en/5/5a/SC_Corinthians_logo.svg'],
  'inter-miami': [
    'https://upload.wikimedia.org/wikipedia/en/7/7c/Inter_Miami_CF_logo.svg',
    'https://upload.wikimedia.org/wikipedia/en/5/52/Inter_Miami_CF_logo.svg',
  ],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function extFromUrl(url, contentType) {
  if (url.endsWith('.png') || contentType?.includes('png')) return 'png';
  return 'svg';
}

async function fetchWithRetry(url) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; SquadBalance/1.0; +https://github.com/squadbalance)',
        Accept: 'image/svg+xml,image/png,image/*,*/*',
      },
    });

    if (res.status === 429) {
      const wait = DELAY_MS * (attempt + 2);
      console.warn(`Rate limited, waiting ${wait}ms…`);
      await sleep(wait);
      continue;
    }

    if (!res.ok) {
      return { ok: false, status: res.status };
    }

    const contentType = res.headers.get('content-type') ?? '';
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 400) {
      return { ok: false, status: 'too-small' };
    }

    return { ok: true, buffer, contentType, ext: extFromUrl(url, contentType) };
  }

  return { ok: false, status: 429 };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const results = [];

  for (const [id, urls] of Object.entries(SOURCES)) {
    let saved = false;

    for (const url of urls) {
      const result = await fetchWithRetry(url);
      if (!result.ok) {
        console.warn(`  ${id}: ${url} -> ${result.status}`);
        await sleep(DELAY_MS);
        continue;
      }

      const filePath = path.join(OUT_DIR, `${id}.${result.ext}`);
      await writeFile(filePath, result.buffer);
      console.log(`Saved ${id}.${result.ext} (${result.buffer.length} bytes)`);
      results.push({ id, ext: result.ext, bytes: result.buffer.length });
      saved = true;
      break;
    }

    if (!saved) {
      console.error(`FAILED ${id} (all sources)`);
      results.push({ id, ext: null, bytes: 0 });
    }

    await sleep(DELAY_MS);
  }

  const ok = results.filter((r) => r.ext).length;
  console.log(`\nDone: ${ok}/${results.length} logos downloaded.`);
}

main();
