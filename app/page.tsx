// app/page.tsx
import { Suspense } from 'react';
import ExperiencesList from './components/ExperiencesList';
import { getExperiences } from './lib/airtable';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
  const experiences = await getExperiences();

  return (
    <main className="min-h-screen">
      <Suspense fallback={
        <div className="bg-rose-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }>
        <ExperiencesList experiences={experiences} />
      </Suspense>
    </main>
  );
}