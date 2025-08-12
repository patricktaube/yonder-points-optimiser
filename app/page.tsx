// app/page.tsx
import { Suspense } from 'react';
import ExperiencesList from './components/ExperiencesList';
import { getExperiences, getCachedExperiences } from './lib/airtable';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home({ 
  searchParams 
}: { 
  searchParams: { refresh?: string } 
}) {
  const forceRefresh = searchParams.refresh === 'true';
  const experiences = await getCachedExperiences(forceRefresh);

  return (
    <div className="main-container">
      <Suspense fallback={<div className="text-center py-8">Loading experiences...</div>}>
        <ExperiencesList experiences={experiences} />
      </Suspense>
    </div>
  );
}