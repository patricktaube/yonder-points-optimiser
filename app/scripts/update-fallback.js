// scripts/update-fallback.js
// Run with: node scripts/update-fallback.js

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function getExperiences() {
  const headers = {
    'Authorization': `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const currentMonth = new Date().getMonth() + 1;

  // Fetch experiences
  const experiencesUrl = new URL(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Experiences`);
  experiencesUrl.searchParams.set('filterByFormula', `AND({Active} = TRUE(), MONTH({Month}) = ${currentMonth})`);
  experiencesUrl.searchParams.set('sort[0][field]', 'Category');
  experiencesUrl.searchParams.set('sort[1][field]', 'Name');

  const experiencesResponse = await fetch(experiencesUrl.toString(), { headers });
  if (!experiencesResponse.ok) {
    throw new Error(`Experiences API error: ${experiencesResponse.status}`);
  }
  const experiencesData = await experiencesResponse.json();

  // Fetch redemption tiers with pagination
  const tiersUrl = new URL(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Redemption%20Tiers`);
  tiersUrl.searchParams.set('filterByFormula', `MONTH({Month (from Experiences)}) = ${currentMonth}`);
  tiersUrl.searchParams.set('sort[0][field]', 'Tier');

  const allTierRecords = [];
  let offset;

  do {
    if (offset) {
      tiersUrl.searchParams.set('offset', offset);
    }
    
    const tiersResponse = await fetch(tiersUrl.toString(), { headers });
    if (!tiersResponse.ok) {
      throw new Error(`Tiers API error: ${tiersResponse.status}`);
    }
    
    const tiersData = await tiersResponse.json();
    allTierRecords.push(...tiersData.records);
    offset = tiersData.offset;
    
  } while (offset);

  // Process experiences
  const experiences = experiencesData.records.map((record) => ({
    id: record.id,
    name: record.fields.Name,
    category: record.fields.Category,
    city: record.fields.City,
    description: record.fields.Description,
    active: record.fields.Active,
    month: record.fields.Month,
    redemptionTiers: [],
  }));

  // Map tiers to experiences
  allTierRecords.forEach((tierRecord) => {
    const experienceIds = tierRecord.fields.Experiences;
    if (!experienceIds || experienceIds.length === 0) return;

    experienceIds.forEach((experienceId) => {
      const experience = experiences.find((exp) => exp.id === experienceId);

      if (experience) {
        const tierText = tierRecord.fields.Tier || '';
        const tierNumber = parseInt(tierText.replace(/\D/g, '')) || 1;

        experience.redemptionTiers.push({
          id: tierRecord.id,
          tierNumber: tierNumber,
          pointsRequired: tierRecord.fields['Points Required'],
          poundValue: tierRecord.fields['Pound Value'],
        });
      }
    });
  });

  // Sort tiers within each experience
  experiences.forEach((exp) => {
    exp.redemptionTiers.sort((a, b) => a.tierNumber - b.tierNumber);
  });

  return experiences;
}

async function updateFallback() {
  console.log('🔄 Fetching fresh data from Airtable...');
  const experiences = await getExperiences();
  
  const fallbackPath = path.join(process.cwd(), 'app/data/fallback-data.ts');
  const monthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const content = `// app/data/fallback-data.ts
// Auto-generated - Last updated: ${new Date().toISOString()}
// Data for: ${monthYear}

import { Experience } from '../lib/airtable';

export const fallbackExperiences: Experience[] = ${JSON.stringify(experiences, null, 2)};
`;
  
  fs.writeFileSync(fallbackPath, content);
  console.log(`✅ Updated fallback data with ${experiences.length} experiences`);
  console.log(`📅 Month: ${monthYear}`);
  console.log(`📝 File: app/data/fallback-data.ts`);
  console.log('\n💡 Next steps:');
  console.log('   1. git add app/data/fallback-data.ts');
  console.log('   2. git commit -m "Update fallback data for ' + monthYear + '"');
  console.log('   3. git push');
}

updateFallback().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});