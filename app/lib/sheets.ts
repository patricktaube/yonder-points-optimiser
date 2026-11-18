// app/lib/sheets.ts
//
// Reads experience data from the private Google Sheet. SERVER-ONLY: this file
// uses the service account's private key and Node's `crypto`, so it must never
// be imported from a 'use client' component.
//
// How auth works (the "service account JWT" flow):
//   1. We build a small JSON claim ("I am <service account>, I want read-only
//      Sheets access, valid for 1 hour") and sign it with the private key.
//      A signed claim like this is called a JWT (JSON Web Token).
//   2. Google checks the signature against the public key it holds for the
//      service account and gives us a short-lived access token.
//   3. We send that token with the Sheets API request.
// The `googleapis` npm package does the same thing, but it's a very large
// dependency for ~25 lines of code.

import { createSign } from 'node:crypto';
import type { Experience } from './experiences';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

// Row 1 is the header, so start at row 2. `A2:F` means "columns A–F, every
// row down to the last one with data".
const DATA_RANGE = 'data!A2:F';
const CITIES_RANGE = 'lists!B2:B';
const FIRST_DATA_ROW = 2; // for log messages that point at a Sheet row number

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function getConfig() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  // The key in the JSON file contains literal "\n" sequences. Environment
  // variables usually keep them as backslash-n, so convert them back into real
  // line breaks or `crypto` can't read the key.
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !sheetId || !privateKey) {
    throw new Error(
      'Missing Google Sheets config: set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY and GOOGLE_SHEET_ID',
    );
  }
  return { email, sheetId, privateKey };
}

// JWTs use "base64url": base64 with URL-safe characters and no padding.
const base64url = (value: string) => Buffer.from(value).toString('base64url');

async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  );
  const unsigned = `${header}.${claims}`;
  // RS256 = an RSA signature over a SHA-256 hash of the header and claims.
  const signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey, 'base64url');

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!response.ok) {
    // Only the status is included: the response body can echo request details.
    throw new Error(`Google token request failed: ${response.status}`);
  }
  const { access_token } = (await response.json()) as { access_token: string };
  return access_token;
}

const cellText = (cell: unknown) => String(cell ?? '').trim();

// Turn a Sheet row into a URL-safe id, e.g. "2025-11-angel-gyms". Used as a
// React key, so it only needs to be unique and stable within the data.
const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Convert raw Sheet rows into Experiences. Exported separately from the fetch
// so it can be tested without calling Google. Invalid rows are skipped (not
// fatal) and logged with their Sheet row number so they're easy to find.
export function parseRows(rows: unknown[][], allCities: string[]): Experience[] {
  const experiences: Experience[] = [];
  const seenIds = new Set<string>();
  const problems: string[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + FIRST_DATA_ROW;
    const note = (reason: string) => {
      problems.push(`row ${rowNumber}: ${reason}`);
    };

    // Completely empty rows are normal (e.g. gaps), so skip them quietly.
    if (row.every((cell) => cellText(cell) === '')) return;

    const [month, name, category, citiesCell] = row.slice(0, 4).map(cellText);
    const points = Number(row[4]);
    const pounds = Number(row[5]);

    // Each check notes the problem, then `return` skips to the next row.
    if (!MONTH_PATTERN.test(month)) return note(`month "${month}" is not YYYY-MM`);
    if (!name || !category) return note('missing experience or category');
    if (!(points > 0) || !(pounds > 0)) return note('points/pounds must be numbers above 0');

    // "All" expands to every city on the `lists` tab. Otherwise keep only
    // known cities, so a typo can't create a bogus city in the dropdown.
    const requested =
      citiesCell.toLowerCase() === 'all' ? allCities : citiesCell.split(',').map((c) => c.trim()).filter(Boolean);
    const cities = requested.filter((city) => allCities.includes(city));
    const unknown = requested.filter((city) => !allCities.includes(city));
    if (unknown.length > 0) note(`unknown cities ignored: ${unknown.join(', ')}`);
    if (cities.length === 0) return note('no valid cities');

    const id = slugify(`${month} ${name}`);
    if (seenIds.has(id)) return note(`duplicate of "${name}" in ${month}, kept the first`);
    seenIds.add(id);

    experiences.push({ id, name, category, cities, month, points, pounds });
  });

  if (problems.length > 0) {
    console.warn(`Sheet: ${problems.length} problem(s) while reading rows:\n  ${problems.join('\n  ')}`);
  }
  return experiences;
}

// Fetch every month's experiences from the Sheet (one API call for both tabs).
export async function fetchExperiences(): Promise<Experience[]> {
  const { email, sheetId, privateKey } = getConfig();
  const token = await getAccessToken(email, privateKey);

  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchGet`);
  url.searchParams.append('ranges', DATA_RANGE);
  url.searchParams.append('ranges', CITIES_RANGE);
  // UNFORMATTED_VALUE returns numbers as numbers (35340), not as displayed
  // text ("35,340"), so cell formatting in the Sheet can't break parsing.
  url.searchParams.set('valueRenderOption', 'UNFORMATTED_VALUE');

  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    throw new Error(`Google Sheets request failed: ${response.status}`);
  }

  // Google omits `values` entirely when a range is empty.
  const { valueRanges } = (await response.json()) as { valueRanges: { values?: unknown[][] }[] };
  const [dataRows = [], cityRows = []] = valueRanges.map((range) => range.values ?? []);
  const allCities = cityRows.map((row) => cellText(row[0])).filter(Boolean);

  const experiences = parseRows(dataRows, allCities);

  // Fail loudly rather than publish an empty page. With ISR, an error during
  // a background revalidation means Next.js keeps serving the last good page.
  if (experiences.length === 0) {
    throw new Error('Google Sheet returned no valid experiences');
  }
  console.log(`Sheet: loaded ${experiences.length} experiences (${dataRows.length} rows)`);
  return experiences;
}
