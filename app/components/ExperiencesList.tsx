// app/components/ExperiencesList.tsx
'use client';

import { useState } from 'react';
import { Experience, getCategories, calculateEffectiveReturn } from '../lib/airtable';
import ExperienceCard from './ExperienceCard';

interface ExperiencesListProps {
  experiences: Experience[];
}

export default function ExperiencesList({ experiences }: ExperiencesListProps) {
  const [isPaidTier, setIsPaidTier] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const categories = getCategories(experiences);
  const filteredExperiences = selectedCategory
    ? experiences.filter((exp) => exp.category === selectedCategory)
    : experiences;

  // Group experiences by category
  const experiencesByCategory = filteredExperiences.reduce((acc, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = [];
    }
    acc[exp.category].push(exp);
    return acc;
  }, {} as Record<string, Experience[]>);

  // Sort experiences within each category by best value
  Object.keys(experiencesByCategory).forEach((category) => {
    experiencesByCategory[category].sort((a, b) => {
      const aMaxValue = Math.max(...a.redemptionTiers.map((t) => t.per1000Points));
      const bMaxValue = Math.max(...b.redemptionTiers.map((t) => t.per1000Points));
      return bMaxValue - aMaxValue;
    });
  });

  return (
    <div>
      {/* Tier Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setIsPaidTier(false)}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
              !isPaidTier
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Free Tier (0.5 pts/£)
          </button>
          <button
            type="button"
            onClick={() => setIsPaidTier(true)}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
              isPaidTier
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Paid Tier (1 pt/£)
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 pb-2 min-w-max">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Experiences by Category */}
      <div className="space-y-8">
        {Object.entries(experiencesByCategory).map(([category, categoryExperiences]) => (
          <div key={category}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryExperiences.map((experience, index) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  isPaidTier={isPaidTier}
                  isBestInCategory={index === 0}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredExperiences.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No experiences found in this category.
        </div>
      )}
    </div>
  );
}