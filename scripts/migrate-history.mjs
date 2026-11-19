// scripts/migrate-history.mjs
//
// ONE-OFF migration script — not part of the build or the site.
// Run from the repo root:   node scripts/migrate-history.mjs
//
// What it does
// ------------
// The old site stored each month's data as a "fallback" snapshot committed to
// git. Those snapshots are our only history, so this script reads them straight
// out of git (no need to check out old commits) and converts them to the new
// Google Sheet format: one row per experience per month, middle tier only.
//
// Outputs (in scripts/migration-output/, which is git-ignored):
//   data.tsv    -> rows ready to paste into the Sheet's `data` tab (columns A–F)
//   review.tsv  -> entries we deliberately did NOT convert, because guessing
//                  would put wrong numbers in the Sheet. Check these by hand.
//
// Why TSV rather than CSV? If you open a TSV in a text editor, copy it, and
// paste into Google Sheets, the tabs split into columns automatically. Pasting
// CSV text puts everything into column A.

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Each monthly snapshot and the commit where it lives in git history.
const SNAPSHOTS = [
  { month: '2025-09', ref: '807c2c7:app/data/fallback-data.ts' },
  { month: '2025-10', ref: '4d0b123:app/data/fallback-data.ts' },
  { month: '2025-11', ref: '28bf59d:app/data/fallback-data.ts' },
];

// Must match column B of the Sheet's `lists` tab. An experience available in
// every one of these is written as "All" to keep the Sheet tidy.
const ALL_CITIES = ['London', 'Birmingham', 'Bristol & Bath', 'Edinburgh', 'Manchester'];

// Tiers should all give the same £ per 1,000 points. More than 1% difference
// means the data is non-linear or has a typo, so a human should look at it.
const MAX_RATE_SPREAD = 0.01;

const OUTPUT_DIR = join('scripts', 'migration-output');

// --- Helpers -----------------------------------------------------------------

// Read a snapshot file from git and pull out the array literal. The files are
// TypeScript (`export const fallbackExperiences: Experience[] = [ ... ]`), but
// the array itself is valid JSON, so we can slice it out and JSON.parse it.
function loadSnapshot(ref) {
  const source = execSync(`git show ${ref}`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const match = source.match(/=\s*(\[[\s\S]*\n\])/);
  if (!match) throw new Error(`Could not find the experiences array in ${ref}`);
  return JSON.parse(match[1]);
}

const ratePer1k = (tier) => (tier.poundValue / tier.pointsRequired) * 1000;

function formatCities(cities) {
  const coversAll = ALL_CITIES.every((city) => cities.includes(city));
  return coversAll ? 'All' : cities.join(', ');
}

// Returns a list of reasons this experience needs a manual check (empty = fine).
function findIssues(tiers) {
  const issues = [];
  if (tiers.length !== 3) issues.push(`${tiers.length} tiers (expected 3)`);

  const points = tiers.map((t) => t.pointsRequired);
  if (new Set(points).size !== points.length) issues.push('duplicate tiers');

  if (tiers.length > 0) {
    const rates = tiers.map(ratePer1k);
    const spread = Math.max(...rates) / Math.min(...rates) - 1;
    if (spread > MAX_RATE_SPREAD) {
      issues.push(`rates differ by ${(spread * 100).toFixed(1)}% across tiers`);
    }
  }
  return issues;
}

// Describe every tier so the review list has everything needed to decide.
const describeTiers = (tiers) =>
  tiers.map((t) => `${t.pointsRequired} pts = £${t.poundValue} (£${ratePer1k(t).toFixed(2)}/1k)`).join(' | ') ||
  '(no tiers)';

const toTsv = (rows) => rows.map((row) => row.join('\t')).join('\n') + '\n';

// --- Main --------------------------------------------------------------------

const dataRows = [];
const reviewRows = [];

for (const { month, ref } of SNAPSHOTS) {
  const experiences = loadSnapshot(ref);
  let converted = 0;

  for (const exp of experiences) {
    // Sort by points so index 1 is the middle tier, regardless of how the
    // old data numbered its tiers.
    const tiers = [...exp.redemptionTiers].sort((a, b) => a.pointsRequired - b.pointsRequired);
    const name = exp.name.trim();
    const cities = formatCities(exp.city);
    const issues = findIssues(tiers);

    if (issues.length > 0) {
      reviewRows.push([month, name, exp.category, cities, issues.join('; '), describeTiers(tiers)]);
      continue;
    }

    const middle = tiers[1];
    dataRows.push([month, name, exp.category, cities, middle.pointsRequired, middle.poundValue]);
    converted++;
  }

  console.log(`${month}: ${experiences.length} experiences -> ${converted} rows, ${experiences.length - converted} for review`);
}

// Sort by month, then category, then name so pasted rows read naturally.
const byMonthCategoryName = (a, b) =>
  a[0].localeCompare(b[0]) || a[2].localeCompare(b[2]) || a[1].localeCompare(b[1]);
dataRows.sort(byMonthCategoryName);
reviewRows.sort(byMonthCategoryName);

mkdirSync(OUTPUT_DIR, { recursive: true });
// data.tsv has no header row: the Sheet already has one, so you paste from A2.
writeFileSync(join(OUTPUT_DIR, 'data.tsv'), toTsv(dataRows));
writeFileSync(
  join(OUTPUT_DIR, 'review.tsv'),
  toTsv([['month', 'experience', 'category', 'cities', 'issue', 'tiers'], ...reviewRows]),
);

// Rate range is a sanity check for the Sheet's "rate outside £1–£8 per 1k" warning.
const rates = dataRows.map((r) => (r[5] / r[4]) * 1000);
console.log(`\nWrote ${dataRows.length} rows to ${join(OUTPUT_DIR, 'data.tsv')}`);
console.log(`Wrote ${reviewRows.length} entries to ${join(OUTPUT_DIR, 'review.tsv')}`);
console.log(`Rate range in converted data: £${Math.min(...rates).toFixed(2)}–£${Math.max(...rates).toFixed(2)} per 1k points`);
