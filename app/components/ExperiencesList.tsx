// app/components/ExperiencesList.tsx
'use client';

import { useState } from 'react';
import { Experience, getCategories, calculateValueMetrics, getBestTier, CARD_TYPES, CardType } from '../lib/airtable';
import ExperienceCard from './ExperienceCard';

interface ExperiencesListProps {
  experiences: Experience[];
}

// Category icons mapping
const categoryIcons: Record<string, string> = {
  'Dining': '🍽️',
  'Travel': '✈️',
  'Hotels': '🏨',
  'Shopping': '🛍️',
  'Fitness': '💪',
  'Entertainment': '🎭',
  'Drinks': '🍸',
  'Coffee': '☕',
  'Wellness': '🧘',
  'Experiences': '🎯',
  'Default': '🎉'
};

export default function ExperiencesList({ experiences }: ExperiencesListProps) {
  const [selectedCardType, setSelectedCardType] = useState<CardType>('credit_free');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
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
    
    const otherExperiences = categoryExperiences.filter(exp => exp.id !== experience.id);
    const hasTie = otherExperiences.some(exp => {
      const otherBestTier = getBestTier(exp.redemptionTiers, selectedCardType);
      if (!otherBestTier) return false;
      const otherMetrics = calculateValueMetrics(otherBestTier, selectedCardType);
      return Math.abs(otherMetrics.effectiveReturn - bestMetrics.effectiveReturn) < 0.01;
    });
    
    return !hasTie;
  };

  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div style={{ backgroundColor: 'var(--background)' }} className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Friendly Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            ✨ Yonder Points Optimizer
          </h1>
          <p className="text-lg mb-6" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
            Find the sweetest deals for your points! 🍑
          </p>
          
          {/* Card Type Selector - More Prominent */}
          <div className="inline-flex rounded-2xl p-1 shadow-lg" style={{ backgroundColor: 'var(--light-peach)' }}>
            {Object.entries(CARD_TYPES).map(([key, cardType]) => (
              <button
                key={key}
                onClick={() => setSelectedCardType(key as CardType)}
                className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  selectedCardType === key ? 'shadow-md transform scale-105' : 'hover:scale-102'
                }`}
                style={{
                  backgroundColor: selectedCardType === key ? 'var(--yonder-orange)' : 'transparent',
                  color: selectedCardType === key ? 'white' : 'var(--foreground)'
                }}
              >
                {cardType.name} ({cardType.pointsPerPound}x)
              </button>
            ))}
          </div>
          
          <p className="text-sm mt-3" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
            You earn {CARD_TYPES[selectedCardType].pointsPerPound} point{CARD_TYPES[selectedCardType].pointsPerPound > 1 ? 's' : ''} per £1 spent
          </p>
        </div>

        {/* Big Friendly Category Pills */}
        <div className="mb-10 overflow-x-auto">
          <div className="flex gap-4 pb-4 min-w-max justify-center">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-lg font-semibold whitespace-nowrap transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                selectedCategory === null ? 'shadow-xl scale-105' : ''
              }`}
              style={{
                backgroundColor: selectedCategory === null ? 'var(--yonder-navy)' : 'white',
                color: selectedCategory === null ? 'white' : 'var(--foreground)'
              }}
            >
              <span className="text-2xl">🌟</span>
              <span>All Categories</span>
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-lg font-semibold whitespace-nowrap transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  selectedCategory === category ? 'shadow-xl scale-105' : ''
                }`}
                style={{
                  backgroundColor: selectedCategory === category ? 'var(--yonder-navy)' : 'white',
                  color: selectedCategory === category ? 'white' : 'var(--foreground)'
                }}
              >
                <span className="text-2xl">{categoryIcons[category] || categoryIcons.Default}</span>
                <span>{category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Experiences by Category - Top 3 with Expand */}
        <div className="space-y-12">
          {Object.entries(experiencesByCategory).map(([category, categoryExperiences]) => {
            const isExpanded = expandedCategories.has(category);
            const displayExperiences = isExpanded ? categoryExperiences : categoryExperiences.slice(0, 3);
            const hasMore = categoryExperiences.length > 3;

            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
                    <span className="text-3xl">{categoryIcons[category] || categoryIcons.Default}</span>
                    <span>{category}</span>
                    <span className="text-lg font-normal px-3 py-1 rounded-full text-white" style={{ backgroundColor: 'var(--yonder-orange)' }}>
                      {categoryExperiences.length}
                    </span>
                  </h2>
                  
                  {hasMore && (
                    <button
                      onClick={() => toggleCategoryExpansion(category)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: 'var(--light-peach)',
                        color: 'var(--yonder-navy)',
                        border: `2px solid var(--yonder-orange)`
                      }}
                    >
                      {isExpanded ? '🔼 Show Less' : `🔽 Show All ${categoryExperiences.length}`}
                    </button>
                  )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {displayExperiences.map((experience, index) => (
                    <ExperienceCard
                      key={experience.id}
                      experience={experience}
                      selectedCardType={selectedCardType}
                      isBestInCategory={index === 0}
                      isUniquelyBest={index === 0 && isUniquelyBest(experience, categoryExperiences)}
                    />
                  ))}
                </div>

                {hasMore && !isExpanded && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => toggleCategoryExpansion(category)}
                      className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                      style={{
                        backgroundColor: 'var(--yonder-orange)',
                        color: 'white'
                      }}
                    >
                      Show {categoryExperiences.length - 3} more {category.toLowerCase()} options
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredExperiences.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😔</div>
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              No experiences found
            </div>
            <p className="text-lg" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              Try selecting a different category or check back later for new experiences!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}