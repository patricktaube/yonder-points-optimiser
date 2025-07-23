// app/components/ExperiencesList.tsx
'use client';

import { useState } from 'react';
import { Experience, getCategories, calculateValueMetrics, getBestTier, CARD_TYPES, CardType } from '../lib/airtable';
import ExperienceCard from './ExperienceCard';

interface ExperiencesListProps {
  experiences: Experience[];
}

export default function ExperiencesList({ experiences }: ExperiencesListProps) {
  const [selectedCardType, setSelectedCardType] = useState<CardType>('credit_free');
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

  // Sort experiences within each category by best value and determine unique best
  Object.keys(experiencesByCategory).forEach((category) => {
    const categoryExperiences = experiencesByCategory[category]
      .filter((exp) => exp.redemptionTiers.length > 0)
      .sort((a, b) => {
        const aBestTier = getBestTier(a.redemptionTiers, selectedCardType);
        const bBestTier = getBestTier(b.redemptionTiers, selectedCardType);
        
        if (!aBestTier || !bBestTier) return 0;
        
        const aMetrics = calculateValueMetrics(aBestTier, selectedCardType);
        const bMetrics = calculateValueMetrics(bBestTier, selectedCardType);
        return bMetrics.effectiveReturn - aMetrics.effectiveReturn;
      });

    experiencesByCategory[category] = categoryExperiences;
  });

  // Helper function to check if an experience is uniquely the best in its category
  const isUniquelyBest = (experience: Experience, categoryExperiences: Experience[]): boolean => {
    if (categoryExperiences.length < 2) return false;
    
    const bestTier = getBestTier(experience.redemptionTiers, selectedCardType);
    if (!bestTier) return false;
    
    const bestMetrics = calculateValueMetrics(bestTier, selectedCardType);
    
    // Check if any other experience has the same effective return
    const otherExperiences = categoryExperiences.filter(exp => exp.id !== experience.id);
    const hasTie = otherExperiences.some(exp => {
      const otherBestTier = getBestTier(exp.redemptionTiers, selectedCardType);
      if (!otherBestTier) return false;
      const otherMetrics = calculateValueMetrics(otherBestTier, selectedCardType);
      return Math.abs(otherMetrics.effectiveReturn - bestMetrics.effectiveReturn) < 0.01;
    });
    
    return !hasTie;
  };

  return (
    <div style={{ backgroundColor: 'var(--background)' }} className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Card Type Dropdown */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Yonder Points Optimizer</h1>
            <p className="text-base" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              With {CARD_TYPES[selectedCardType].name}, you earn {CARD_TYPES[selectedCardType].pointsPerPound} point{CARD_TYPES[selectedCardType].pointsPerPound > 1 ? 's' : ''} per £1 spent
            </p>
          </div>
          
          <div className="relative">
            <select
              value={selectedCardType}
              onChange={(e) => setSelectedCardType(e.target.value as CardType)}
              className="appearance-none bg-white border-2 rounded-lg px-4 py-3 pr-10 text-sm font-medium hover:border-blue-300 focus:outline-none focus:ring-2 focus:border-blue-500 shadow-sm"
              style={{ 
                borderColor: 'var(--border-color)',
                color: 'var(--foreground)'
              }}
            >
              {Object.entries(CARD_TYPES).map(([key, cardType]) => (
                <option key={key} value={key}>
                  {cardType.name} ({cardType.pointsPerPound}x)
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-3 pb-2 min-w-max">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? 'text-white shadow-sm'
                  : 'bg-white hover:bg-gray-50 border'
              }`}
              style={{
                backgroundColor: selectedCategory === null ? 'var(--yonder-navy)' : 'white',
                borderColor: selectedCategory === null ? 'var(--yonder-navy)' : 'var(--border-color)',
                color: selectedCategory === null ? 'white' : 'var(--foreground)'
              }}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'text-white shadow-sm'
                    : 'bg-white hover:bg-gray-50 border'
                }`}
                style={{
                  backgroundColor: selectedCategory === category ? 'var(--yonder-navy)' : 'white',
                  borderColor: selectedCategory === category ? 'var(--yonder-navy)' : 'var(--border-color)',
                  color: selectedCategory === category ? 'white' : 'var(--foreground)'
                }}
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
              <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                <span className="text-white px-2 py-1 rounded text-sm font-medium mr-3" style={{ backgroundColor: 'var(--yonder-orange)' }}>
                  {category}
                </span>
                <span className="text-sm font-normal" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                  {categoryExperiences.length} experience{categoryExperiences.length !== 1 ? 's' : ''}
                </span>
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {categoryExperiences.map((experience, index) => (
                  <ExperienceCard
                    key={experience.id}
                    experience={experience}
                    selectedCardType={selectedCardType}
                    isBestInCategory={index === 0}
                    isUniquelyBest={index === 0 && isUniquelyBest(experience, categoryExperiences)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredExperiences.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
            <div className="text-lg font-medium mb-2">No experiences found</div>
            <p className="text-sm">Try selecting a different category or check back later for new experiences.</p>
          </div>
        )}
      </div>
    </div>
  );
}