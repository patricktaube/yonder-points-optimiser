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

// Badge system interfaces
export interface BadgeThresholds {
  bestValueThreshold: number;
  badDealThreshold: number;
}

export type BadgeType = 'best-value' | 'bad-deal' | null;

const BADGE_PERCENTILES = {
  BEST_VALUE: 95, // 95th percentile for best value
  BAD_DEAL: 20,   // 20th percentile for bad deal
} as const;

const FALLBACK_THRESHOLDS = {
  BEST_VALUE: 2.0,
  BAD_DEAL: 1.6
} as const;

const BADGE_POSITION_OFFSET = {
  TOP: -10,
  RIGHT: -10
} as const;

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

// Helper function to get unique categories in preferred order
export function getCategories(experiences: Experience[]): string[] {
  const categoriesFromData = new Set(experiences.map((exp) => exp.category));

  // Define preferred order - you can modify this array to change the order
  const preferredOrder = [
    'Dining',
    'Travel',
    'Hotels',
    'Shopping',
    'Drinks',
    'Coffee',
    'Fitness',
    'Entertainment',
    'Wellness',
    'Experiences'
  ];

  // Start with preferred order, only including categories that exist in data
  const orderedCategories = preferredOrder.filter(cat => categoriesFromData.has(cat));

  // Add any remaining categories that weren't in our preferred order
  const remainingCategories = Array.from(categoriesFromData).filter(cat => !preferredOrder.includes(cat));

  return [...orderedCategories, ...remainingCategories];
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

// --- Badges ------------------------------------------------------------------

// Calculate percentile helper function
function getPercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;

  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
}

// Calculate global badge thresholds based on all experiences and selected card type
export function calculateBadgeThresholds(experiences: Experience[], cardType: CardType): BadgeThresholds {
  const allReturnRates = experiences
    .map((exp) => calculateValueMetrics(exp, cardType).effectiveReturn)
    .sort((a, b) => a - b);

  if (allReturnRates.length === 0) {
    return {
      bestValueThreshold: FALLBACK_THRESHOLDS.BEST_VALUE,
      badDealThreshold: FALLBACK_THRESHOLDS.BAD_DEAL
    };
  }

  return {
    bestValueThreshold: getPercentile(allReturnRates, BADGE_PERCENTILES.BEST_VALUE),
    badDealThreshold: getPercentile(allReturnRates, BADGE_PERCENTILES.BAD_DEAL),
  };
}

// Determine what badge (if any) an experience should get
export function getExperienceBadge(
  experience: Experience,
  cardType: CardType,
  thresholds: BadgeThresholds,
): BadgeType {
  const { effectiveReturn } = calculateValueMetrics(experience, cardType);

  if (effectiveReturn >= thresholds.bestValueThreshold) return 'best-value';
  if (effectiveReturn <= thresholds.badDealThreshold) return 'bad-deal';
  return null;
}

// Export constants for use in components
export const CONSTANTS = {
  BADGE_POSITION_OFFSET
} as const;
