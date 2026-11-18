import { Suspense } from 'react';
import ExperiencesList from './components/ExperiencesList';
import { fetchExperiences } from './lib/sheets';
import { formatMonth, getLatestMonth } from './lib/experiences';

// ISR (Incremental Static Regeneration): the page is built as static HTML and
// regenerated in the background at most once an hour. Data changes monthly,
// so this is plenty fresh. If the Sheet fetch fails during a regeneration,
// Next.js keeps serving the last good page.
//
// Note: this page must not read `searchParams` (e.g. the old `?refresh=true`).
// Doing so forces a fresh server render on every request, which turns ISR off.
export const revalidate = 3600;

export default async function Home() {
  const allExperiences = await fetchExperiences();

  // The Sheet holds every month. Only send the latest month to the browser.
  // This keeps the page small, and the label tells visitors which month
  // they're looking at, even if this month's data isn't in yet.
  const latestMonth = getLatestMonth(allExperiences);
  const experiences = allExperiences.filter((exp) => exp.month === latestMonth);

  return (
    <div className="main-container">
      <Suspense fallback={<div className="text-center py-8">Loading experiences...</div>}>
        <ExperiencesList experiences={experiences} monthLabel={formatMonth(latestMonth)} />
      </Suspense>
    </div>
  );
}
