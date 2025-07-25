// app/lib/airtable.ts

// Define interfaces for Airtable record types
// -------------------------------------------
// These interfaces match the structures of the Airtable records

interface AirtableExperienceRecord {
  id: string;
  fields: {
    Name: string;
    Category: string;
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


export async function getExperiences(): Promise<Experience[]> {
  try {
    const headers = {
      'Authorization': `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // Fetch experiences
    const experiencesUrl = new URL(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Experiences`);
    experiencesUrl.searchParams.set('filterByFormula', '{Active} = TRUE()');
    experiencesUrl.searchParams.set('sort[0][field]', 'Category');
    experiencesUrl.searchParams.set('sort[1][field]', 'Name');

    const experiencesResponse = await fetch(experiencesUrl.toString(), { headers });

    if (!experiencesResponse.ok) {
      console.error('Experiences API error:', await experiencesResponse.text());
      throw new Error(`Experiences API error: ${experiencesResponse.status}`);
    }

    const experiencesData = await experiencesResponse.json() as AirtableResponse<AirtableExperienceRecord>;

    // Fetch redemption tiers
    const tiersUrl = new URL(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Redemption%20Tiers`);
    tiersUrl.searchParams.set('sort[0][field]', 'Tier'); // Changed from 'Tier_Number' to 'Tier'

    const tiersResponse = await fetch(tiersUrl.toString(), { headers });

    if (!tiersResponse.ok) {
      console.error('Tiers API error:', await tiersResponse.text());
      throw new Error(`Tiers API error: ${tiersResponse.status}`);
    }

    const tiersData = await tiersResponse.json() as AirtableResponse<AirtableTierRecord>;

    console.log('Sample tier record:', tiersData.records[0]); // Debug log

    // Process experiences
    const experiences: Experience[] = experiencesData.records.map((record) => ({
      id: record.id,
      name: record.fields.Name,
      category: record.fields.Category,
      description: record.fields.Description,
      active: record.fields.Active,
      month: record.fields.Month,
      redemptionTiers: [],
    }));

    // Map tiers to experiences
    tiersData.records.forEach((tierRecord) => {
      const experienceIds = tierRecord.fields.Experiences; // Changed from 'Experience' to 'Experiences'
      if (!experienceIds || experienceIds.length === 0) return;

      const experienceId = experienceIds[0];
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
    return currentMetrics.effectiveReturn > bestMetrics.effectiveReturn ? current : best;
  });
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
    return { bestValueThreshold: 2.0, badDealThreshold: 1.6 }; // Fallback values in percentage
  }

  // Calculate percentiles
  const getPercentile = (percentile: number) => {
    const index = Math.ceil((percentile / 100) * allReturnRates.length) - 1;
    return allReturnRates[Math.max(0, Math.min(index, allReturnRates.length - 1))];
  };

  return {
    bestValueThreshold: getPercentile(95), // 95th percentile for "Best Value"
    badDealThreshold: getPercentile(20),   // 20th percentile for "Bad Deal"
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
  
  // Global badges take priority
  if (metrics.effectiveReturn >= thresholds.bestValueThreshold) {
    return 'best-value';
  }
  
  if (metrics.effectiveReturn <= thresholds.badDealThreshold) {
    return 'bad-deal';
  }
  
  return null;
}
