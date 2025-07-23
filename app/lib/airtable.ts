// app/lib/airtable.ts
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

    const experiencesData = await experiencesResponse.json();

    // Fetch redemption tiers
    const tiersUrl = new URL(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Redemption%20Tiers`);
    tiersUrl.searchParams.set('sort[0][field]', 'Tier'); // Changed from 'Tier_Number' to 'Tier'

    const tiersResponse = await fetch(tiersUrl.toString(), { headers });

    if (!tiersResponse.ok) {
      console.error('Tiers API error:', await tiersResponse.text());
      throw new Error(`Tiers API error: ${tiersResponse.status}`);
    }

    const tiersData = await tiersResponse.json();

    console.log('Sample tier record:', tiersData.records[0]); // Debug log

    // Process experiences
    const experiences: Experience[] = experiencesData.records.map((record: any) => ({
      id: record.id,
      name: record.fields.Name,
      category: record.fields.Category,
      description: record.fields.Description,
      active: record.fields.Active,
      month: record.fields.Month,
      redemptionTiers: [],
    }));

    // Map tiers to experiences
    tiersData.records.forEach((tierRecord: any) => {
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