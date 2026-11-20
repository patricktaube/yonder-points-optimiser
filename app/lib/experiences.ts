// app/lib/experiences.ts
//
// The Experience data model plus the value maths and badge logic. This file is
// imported by client components, so it must stay free of server-only code
// (fetching lives in sheets.ts).

// One row of the Google Sheet = one experience in one month.
export interface Experience {
  id: string;       // slug of month + name, e.g. "2025-11-angel-gyms" (React key)
  name: string;
  category: string;
  cities: string[]; // "All" already expanded to the full city list
  month: string;    // "YYYY-MM"
  points: number;   // middle tier points
  pounds: number;   // middle tier £ value
}

// Card types with their earning rates
export const CARD_TYPES = {
  debit_free: { name: 'Debit Free', pointsPerPound: 1 },
  debit_paid: { name: 'Debit Paid', pointsPerPound: 4 },
  credit_free: { name: 'Credit Free', pointsPerPound: 1 },
  credit_paid: { name: 'Credit Paid', pointsPerPound: 5 },
} as const;

export type CardType = keyof typeof CARD_TYPES;

// --- Months ------------------------------------------------------------------

// "YYYY-MM" strings sort correctly as plain text ("2025-11" > "2025-09"), so
// the latest month is simply the largest string.
export function getLatestMonth(experiences: Experience[]): string {
  return experiences.reduce((latest, exp) => (exp.month > latest ? exp.month : latest), '');
}

// "2025-11" -> "November 2025". Uses UTC so the server's timezone can't shift
// the 1st of the month into the previous month.
export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// --- Categories --------------------------------------------------------------

// The single source of truth for category display order and icons. Names must
// match the Sheet's `lists` tab exactly (e.g. "Fit&Well"). To add a category,
// add a line here. Categories in the data but missing here still show up
// (after these, with the default icon), so nothing disappears by accident.
export const CATEGORIES = [
  { name: 'Dining', icon: '🍽️' },
  { name: 'Travel', icon: '🌴' },
  { name: 'Flights', icon: '✈️' },
  { name: 'Hotels', icon: '🏨' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Entertainment', icon: '🎉' },
  { name: 'Theatre', icon: '🎭' },
  { name: 'Wellness', icon: '🧘' },
  { name: 'Fit&Well', icon: '💪' },
  { name: 'Lounges', icon: '🛋️' },
  { name: 'Treats', icon: '🥐' },
  { name: 'Pubs', icon: '🍻' },
] as const;

const DEFAULT_CATEGORY_ICON = '🎉';
const CATEGORY_ORDER: readonly string[] = CATEGORIES.map((c) => c.name);

export function getCategoryIcon(category: string): string {
  return CATEGORIES.find((c) => c.name === category)?.icon ?? DEFAULT_CATEGORY_ICON;
}

// Unique categories present in the data, in CATEGORIES order.
export function getCategories(experiences: Experience[]): string[] {
  const categoriesFromData = new Set(experiences.map((exp) => exp.category));

  const ordered = CATEGORY_ORDER.filter((name) => categoriesFromData.has(name));
  const unlisted = [...categoriesFromData].filter((name) => !CATEGORY_ORDER.includes(name));

  return [...ordered, ...unlisted];
}

// --- Value maths -------------------------------------------------------------

// Every tier of an experience has the same rate, so one points/£ pair is
// enough. No "best tier" step is needed any more.
export function calculateValueMetrics(
  experience: Pick<Experience, 'points' | 'pounds'>,
  cardType: CardType
) {
  const { pointsPerPound } = CARD_TYPES[cardType];
  const poundsToSpend = experience.points / pointsPerPound;          // £ you must spend to earn the points
  const effectiveReturn = (experience.pounds / poundsToSpend) * 100; // % of that spend you get back
  const valuePerKPoints = (experience.pounds / experience.points) * 1000;

  return {
    poundsToSpend,
    effectiveReturn,
    valuePerKPoints,
  };
}

// --- Tiers and value labels ---------------------------------------------------

// Yonder sells each experience in three tiers at 1x, 2x and 4x the same rate.
// The Sheet stores the middle (2x) tier, so the small tier is half of it and
// the large tier is double.
export interface Tier {
  points: number;
  pounds: number;
}

export function getTiers(experience: Pick<Experience, 'points' | 'pounds'>): Tier[] {
  const { points, pounds } = experience;
  return [
    { points: Math.round(points / 2), pounds: pounds / 2 },
    { points, pounds },
    { points: points * 2, pounds: pounds * 2 },
  ];
}

// The biggest tier the balance covers, or null if it covers none.
export function getBestAffordableTier(tiers: Tier[], balance: number): Tier | null {
  let best: Tier | null = null;
  tiers.forEach((tier) => {
    if (tier.points <= balance) best = tier;
  });
  return best;
}

// What 10,000 points are worth in £. This is the headline number on the site.
export function valuePer10k(experience: Pick<Experience, 'points' | 'pounds'>): number {
  return (experience.pounds / experience.points) * 10000;
}

export function averageValuePer10k(experiences: Experience[]): number {
  if (experiences.length === 0) return 0;
  return experiences.reduce((sum, exp) => sum + valuePer10k(exp), 0) / experiences.length;
}

// Labels compare a rate with the city average for the month:
// 15% or more above it is "Great value", 20% or more below it is "Poor value".
const GREAT_VALUE_RATIO = 1.15;
const POOR_VALUE_RATIO = 0.8;

export type ValueLabel = 'Great value' | 'Poor value' | null;

export function getValueLabel(value: number, average: number): ValueLabel {
  if (average <= 0) return null;
  const ratio = value / average;
  if (ratio >= GREAT_VALUE_RATIO) return 'Great value';
  if (ratio < POOR_VALUE_RATIO) return 'Poor value';
  return null;
}

// --- Formatting ----------------------------------------------------------------

export const formatPoints = (n: number) => Math.round(n).toLocaleString('en-GB');

// Whole pounds stay whole (£19), anything else gets pence (£37.50).
export const formatPounds = (x: number) => (Number.isInteger(x) ? `£${x}` : `£${x.toFixed(2)}`);
