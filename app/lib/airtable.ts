// app/lib/airtable.ts

// Define interfaces for Airtable record types
// -------------------------------------------
// These interfaces match the structures of the Airtable records

let memoryCache: { data: Experience[], timestamp: number, month: number } | null = null;
// This will be used to cache the experiences data in memory for performance

interface AirtableExperienceRecord {
  id: string;
  fields: {
    Name: string;
    Category: string;
    City: string[];
    Description?: string;
    Active: boolean;
    Month: string;
  };
}

interface AirtableTierRecord {
  id: string;
  fields: {
    Tier: string;
    Experiences?: string[];
    'Points Required': number;
    'Pound Value': number;
    'Month (from Experiences)': string; // ADDED: Month field to match your Airtable structure
  };
}

interface AirtableResponse<T> {
  records: T[];
}

export interface RedemptionTier {
  id: string;
  tierNumber: number;
  pointsRequired: number;
  poundValue: number;
}

export interface Experience {
  id: string;
  name: string;
  category: string;
  city: string[];
  description?: string;
  active: boolean;
  month: string;
  redemptionTiers: RedemptionTier[];
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

// Constants for magic numbers used in the code; this is useful for performance optimisation.
// The code won't have to recalculate these values every time.

const BADGE_PERCENTILES = {
  BEST_VALUE: 95, // 95th percentile for best value
  BAD_DEAL: 20,   // 20th percentile for bad deal
} as const;

const FALLBACK_THRESHOLDS = {
  BEST_VALUE: 2.0,
  BAD_DEAL: 1.6
} as const;

// Constants for floating point comparisons and positioning
const FLOATING_POINT_TOLERANCE = 0.05;
const BADGE_POSITION_OFFSET = {
  TOP: -4,
  RIGHT: -3
} as const;

// Validate environment variables
function validateEnvironment() {
  const requiredVars = ['AIRTABLE_PERSONAL_ACCESS_TOKEN', 'AIRTABLE_BASE_ID'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export async function getExperiences(): Promise<Experience[]> {
  try {
    validateEnvironment(); // Add environment validation
    
    const headers = {
      'Authorization': `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // Constant to fetch the current month
    const currentMonth = new Date().getMonth() + 1; // e.g., August = 8

    // Fetch experiences
    const experiencesUrl = new URL(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Experiences`);
    experiencesUrl.searchParams.set('filterByFormula', `AND({Active} = TRUE(), MONTH({Month}) = ${currentMonth})`);
    experiencesUrl.searchParams.set('sort[0][field]', 'Category');
    experiencesUrl.searchParams.set('sort[1][field]', 'Name');

    const experiencesResponse = await fetch(experiencesUrl.toString(), { headers });

    if (!experiencesResponse.ok) {
      console.error('Experiences API error status:', experiencesResponse.status);
      // Don't log the full error text in production to avoid information leakage, particularly of API keys
      if (process.env.NODE_ENV === 'development') {
        const errorText = await experiencesResponse.text();
        console.error('Experiences API error details:', errorText);
      }
      throw new Error(`Experiences API error: ${experiencesResponse.status}`);
    }

    const experiencesData = await experiencesResponse.json() as AirtableResponse<AirtableExperienceRecord>;

    // Fetch redemption tiers - FIXED: Added month filter here too
    const tiersUrl = new URL(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Redemption%20Tiers`);
    tiersUrl.searchParams.set('filterByFormula', `MONTH({Month (from Experiences)}) = ${currentMonth}`); // ADDED: Month filter
    tiersUrl.searchParams.set('sort[0][field]', 'Tier');

    const tiersResponse = await fetch(tiersUrl.toString(), { headers });

    if (!tiersResponse.ok) {
      console.error('Tiers API error status:', tiersResponse.status);
      if (process.env.NODE_ENV === 'development') {
        const errorText = await tiersResponse.text();
        console.error('Tiers API error details:', errorText);
      }
      throw new Error(`Tiers API error: ${tiersResponse.status}`);
    }
    const tiersData = await tiersResponse.json() as AirtableResponse<AirtableTierRecord>;

    // Process experiences
    const experiences: Experience[] = experiencesData.records.map((record) => ({
      id: record.id,
      name: record.fields.Name,
      category: record.fields.Category,
      city: record.fields.City,
      description: record.fields.Description,
      active: record.fields.Active,
      month: record.fields.Month,
      redemptionTiers: [],
    }));

    // Map tiers to experiences - FIXED: Loop through ALL linked experiences
    tiersData.records.forEach((tierRecord) => {
      const experienceIds = tierRecord.fields.Experiences;
      if (!experienceIds || experienceIds.length === 0) return;

      // FIXED: Loop through ALL linked experiences, not just the first one
      experienceIds.forEach((experienceId) => {
        const experience = experiences.find((exp) => exp.id === experienceId);

        if (experience) {
          // Convert tier text to number (assuming "Tier 1", "Tier 2", etc.)
          const tierText = tierRecord.fields.Tier || '';
          const tierNumber = parseInt(tierText.replace(/\D/g, '')) || 1;

          experience.redemptionTiers.push({
            id: tierRecord.id,
            tierNumber: tierNumber, // Parsed from Tier field
            pointsRequired: tierRecord.fields['Points Required'], // Note the space
            poundValue: tierRecord.fields['Pound Value'], // Note the space
          });
        }
      });
    });

    // Sort tiers within each experience
    experiences.forEach((exp) => {
      exp.redemptionTiers.sort((a, b) => a.tierNumber - b.tierNumber);
    });

    console.log(`Loaded ${experiences.length} experiences`);
    console.log(`Sample experience:`, experiences[0]);

    return experiences;
  } catch (error) {
    console.error('Error fetching from Airtable:', error);
    return [];
  }
}

// Function to get cached experiences, with optional force refresh
// This will cache the experiences to a file for performance
// and to avoid hitting the Airtable API too frequently.

export async function getCachedExperiences(forceRefresh = false): Promise<Experience[]> {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const isServer = typeof window === 'undefined';
  
  if (!isServer) {
    console.log('Client-side call, fetching directly');
    return await getExperiences();
  }

  try {
    const fs = await import('fs');
    const { join } = await import('path');
    
    // Use project-local cache for development, /tmp for Vercel
    const cacheDir = process.env.VERCEL ? '/tmp' : join(process.cwd(), '.cache');
    const cacheFile = join(cacheDir, `experiences-${currentYear}-${currentMonth.toString().padStart(2, '0')}.json`);
    
    // Ensure cache directory exists (for local development)
    if (!process.env.VERCEL && !fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    if (!forceRefresh && fs.existsSync(cacheFile)) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      console.log(`Returning cached experiences from ${cacheFile}`);
      return cached;
    }
    
    if (forceRefresh) {
      console.log('Force refresh requested, fetching fresh data');
    } else {
      console.log('No valid cache found, fetching fresh data');
    }
    
    const experiences = await getExperiences();
    fs.writeFileSync(cacheFile, JSON.stringify(experiences));
    console.log(`Cached ${experiences.length} experiences to ${cacheFile}`);
    return experiences;
    
  } catch (fsError) {
    // Fallback to memory cache
    console.log('Filesystem not available, using memory cache');
    
    if (!forceRefresh && memoryCache && memoryCache.month === currentMonth) {
      console.log('Returning memory cached experiences');
      return memoryCache.data;
    }
    
    const experiences = await getExperiences();
    memoryCache = { data: experiences, timestamp: Date.now(), month: currentMonth };
    console.log('Cached to memory');
    return experiences;
  }
}

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

// Updated calculation functions
export function calculateValueMetrics(
  tier: RedemptionTier,
  cardType: CardType
) {
  const { pointsPerPound } = CARD_TYPES[cardType];
  const poundsToSpend = tier.pointsRequired / pointsPerPound;
  const effectiveReturn = (tier.poundValue / poundsToSpend) * 100;
  const valuePerKPoints = (tier.poundValue / tier.pointsRequired) * 1000;

  return {
    poundsToSpend,
    effectiveReturn,
    valuePerKPoints,
  };
}

// Helper to get the best tier for an experience
export function getBestTier(
  redemptionTiers: RedemptionTier[],
  cardType: CardType
): RedemptionTier | null {
  if (redemptionTiers.length === 0) return null;
  
  return redemptionTiers.reduce((best, current) => {
    const bestMetrics = calculateValueMetrics(best, cardType);
    const currentMetrics = calculateValueMetrics(current, cardType);
    return currentMetrics.effectiveReturn > bestMetrics.effectiveReturn ?
      current : best;
  });
}

// Calculate percentile helper function
function getPercentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
}

// Calculate global badge thresholds based on all experiences and selected card type
export function calculateBadgeThresholds(experiences: Experience[], cardType: CardType): BadgeThresholds {
  // Get all effective return rates across all experiences for the selected card type
  const allReturnRates: number[] = [];
  
  experiences.forEach(experience => {
    const bestTier = getBestTier(experience.redemptionTiers, cardType);
    if (bestTier) {
      const metrics = calculateValueMetrics(bestTier, cardType);
      allReturnRates.push(metrics.effectiveReturn);
    }
  });

  // Sort rates to calculate percentiles
  allReturnRates.sort((a, b) => a - b);

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
  const bestTier = getBestTier(experience.redemptionTiers, cardType);
  if (!bestTier) return null;
  
  const metrics = calculateValueMetrics(bestTier, cardType);
  
  // Global badges based on percentile thresholds
  if (metrics.effectiveReturn >= thresholds.bestValueThreshold) {
    return 'best-value';
  }
  
  if (metrics.effectiveReturn <= thresholds.badDealThreshold) {
    return 'bad-deal';
  }
  
  return null;
}

// Export constants for use in components
export const CONSTANTS = {
  FLOATING_POINT_TOLERANCE,
  BADGE_POSITION_OFFSET
} as const;