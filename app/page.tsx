// // app/page.tsx
// import { Suspense } from 'react';
// import ExperiencesList from './components/ExperiencesList';
// import { getExperiences } from './lib/airtable';

// export const revalidate = 300; // Revalidate every 5 minutes

// export default async function Home() {
//   const experiences = await getExperiences();

//   return (
//     <main className="min-h-screen" style={{ backgroundColor: '#fef7f0' }}>
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <header className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             Yonder Points Optimiser
//           </h1>
//           <p className="text-gray-600">
//             Find the best value redemptions for your Yonder points
//           </p>
//         </header>

//         <Suspense fallback={<div className="text-center py-8">Loading experiences...</div>}>
//           <ExperiencesList experiences={experiences} />
//         </Suspense>
//       </div>
//     </main>
//   );
// }

// app/page.tsx
import { Suspense } from 'react';
import ExperiencesList from './components/ExperiencesList';
import { getExperiences } from './lib/airtable';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
  const experiences = await getExperiences();

  return (
    <div className="main-container">
      <Suspense fallback={<div className="text-center py-8">Loading experiences...</div>}>
        <ExperiencesList experiences={experiences} />
      </Suspense>
    </div>
  );
}