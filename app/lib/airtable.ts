// app/lib/airtable.ts
import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

export interface RedemptionTier {
  id: string;
  tierNumber: number;
  pointsRequired: number;
  poundValue: number;
  per1000Points: number;
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

export async function getExperiences(): Promise<Experience[]> {
  try {
    // Fetch all active experiences
    const experiencesRecords = await base('Experiences')
      .select({
        filterByFormula: '{Active} = TRUE()',
        sort: [{ field: 'Category' }, { field: 'Name' }],
      })
      .all();

    // Fetch all redemption tiers
    const tiersRecords = await base('Redemption Tiers')
      .select({
        sort: [{ field: 'Tier_Number' }],
      })
      .all();

    // Process experiences
    const experiences: Experience[] = experiencesRecords.map((record) => ({
      id: record.id,
      name: record.get('Name') as string,
      category: record.get('Category') as string,
      description: record.get('Description') as string | undefined,
      active: record.get('Active') as boolean,
      month: record.get('Month') as string,
      redemptionTiers: [],
    }));

    // Map tiers to experiences
    tiersRecords.forEach((tierRecord) => {
      const experienceIds = tierRecord.get('Experience') as string[];
      if (!experienceIds || experienceIds.length === 0) return;

      const experienceId = experienceIds[0];
      const experience = experiences.find((exp) => exp.id === experienceId);

      if (experience) {
        experience.redemptionTiers.push({
          id: tierRecord.id,
          tierNumber: tierRecord.get('Tier_Number') as number,
          pointsRequired: tierRecord.get('Points_Required') as number,
          poundValue: tierRecord.get('Pound_Value') as number,
          per1000Points: tierRecord.get('Per_1000_Points') as number,
        });
      }
    });

    // Sort tiers within each experience
    experiences.forEach((exp) => {
      exp.redemptionTiers.sort((a, b) => a.tierNumber - b.tierNumber);
    });

    return experiences;
  } catch (error) {
    console.error('Error fetching from Airtable:', error);
    return [];
  }
}

// Helper function to get unique categories
export function getCategories(experiences: Experience[]): string[] {
  const categories = new Set(experiences.map((exp) => exp.category));
  return Array.from(categories);
}

// Helper function to calculate effective return rate
export function calculateEffectiveReturn(
  per1000Points: number,
  isPaidTier: boolean
): number {
  const pointsPerPound = isPaidTier ? 1 : 0.5;
  const poundsBackPer1000Spent = isPaidTier ? per1000Points : per1000Points / 2;
  return poundsBackPer1000Spent / 10; // Convert to percentage
}