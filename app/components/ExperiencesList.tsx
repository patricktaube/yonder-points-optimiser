// app/components/ExperiencesList.tsx
'use client';

import { useState } from 'react';
import { useMemo } from 'react';
import { Experience, getCategories, calculateValueMetrics, getBestTier, CARD_TYPES, CardType, calculateBadgeThresholds } from '../lib/airtable';
import ExperienceCard from './ExperienceCard';

interface ExperiencesListProps {
  experiences: Experience[];
}

// Category icons mapping
const categoryIcons: Record<string, string> = {
  'Dining': '🍽️',
  'Travel': '🌴',
  "Flights": '✈️',
  'Hotels': '🏨',
  'Shopping': '🛍️',
  'Fit & Well': '💪',
  'Theatre': '🎭',
  'Lounges': '🛋️',
  'Treats': '🥐',
  "Pubs": "🍻",
  'Wellness': '🧘',
  'Default': '🎉'
};

export default function ExperiencesList({ experiences }: ExperiencesListProps) {
  const [selectedCardType, setSelectedCardType] = useState<CardType>('credit_free');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const categories = getCategories(experiences);
  const filteredExperiences = selectedCategory
    ? experiences.filter((exp) => exp.category === selectedCategory)
    : experiences;

  // Calculate badge thresholds for the selected card type
const badgeThresholds = useMemo(() => 
  calculateBadgeThresholds(experiences, selectedCardType), 
  [experiences, selectedCardType]
);
  // Group experiences by category and maintain the same order as categories
  const experiencesByCategory: Record<string, Experience[]> = {};
  
  // Initialize with empty arrays in the correct order
  categories.forEach(category => {
    experiencesByCategory[category] = [];
  });
  
  // Fill the arrays with experiences
  filteredExperiences.forEach(exp => {
    if (experiencesByCategory[exp.category]) {
      experiencesByCategory[exp.category].push(exp);
    }
  });

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

  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const selectedCard = CARD_TYPES[selectedCardType];

  return (
    <div style={{ backgroundColor: '#fef7f0' }} className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Card Type Dropdown in Top Right */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Yonder Points Optimiser
            </h1>
            <p className="text-lg" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
              Find the best-value redemptions for your points!
            </p>
          </div>
          
          {/* Pill-style Card Type Selector */}
          <div className="relative">
            {/* Large pill container */}
            <div className="inline-flex items-center bg-none border-2 rounded-full px-3 py-2 shadow-lg" style={{ borderColor: 'var(--yonder-orange)' }}>
              <span className="text-sm font-medium px-2" style={{ color: 'var(--foreground)' }}>
                Card Type:
              </span>
              
              {/* Dropdown pill - smaller pill inside */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:shadow-md min-w-32"
                  style={{ backgroundColor: 'var(--yonder-orange)' }}
                >
                  <span className="text-sm">{selectedCard?.name}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border-2 rounded-xl shadow-lg z-50" style={{ borderColor: 'var(--yonder-orange)' }}>
                    {Object.entries(CARD_TYPES).map(([key, cardType]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedCardType(key as CardType);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl ${
                          selectedCardType === key ? 'text-white' : 'hover:bg-orange-50'
                        }`}
                        style={{ 
                          backgroundColor: selectedCardType === key ? 'var(--yonder-orange)' : 'transparent',
                          color: selectedCardType === key ? 'white' : 'var(--foreground)'
                        }}
                      >
                        <div className="font-semibold">{cardType.name}</div>
                        <div className="text-sm opacity-75">{cardType.pointsPerPound} pts/£</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Click outside handler */}
            {isDropdownOpen && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsDropdownOpen(false)}
              />
            )}
          </div>
        </div>

{/* Top 3 Overall Best Redemptions */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
              This month's best redemption rates
            </h2>
           </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {(() => {
              // Get all experiences with their best tiers and calculate metrics
              const allExperiencesWithMetrics = experiences
                .filter(exp => exp.redemptionTiers.length > 0)
                .map(exp => {
                  const bestTier = getBestTier(exp.redemptionTiers, selectedCardType);
                  if (!bestTier) return null;
                  const metrics = calculateValueMetrics(bestTier, selectedCardType);
                  return {
                    experience: exp,
                    tier: bestTier,
                    metrics
                  };
                })
                .filter(item => item !== null)
                .sort((a, b) => b!.metrics.effectiveReturn - a!.metrics.effectiveReturn)
                .slice(0, 3);

              // Calculate average for comparison
              const allValidMetrics = experiences
                .filter(exp => exp.redemptionTiers.length > 0)
                .map(exp => {
                  const bestTier = getBestTier(exp.redemptionTiers, selectedCardType);
                  if (!bestTier) return null;
                  return calculateValueMetrics(bestTier, selectedCardType);
                })
                .filter(m => m !== null);
              
              const averageReturn = allValidMetrics.length > 0 
                ? allValidMetrics.reduce((sum, m) => sum + m!.effectiveReturn, 0) / allValidMetrics.length
                : 0;

              return allExperiencesWithMetrics.map((item, index) => {
                if (!item) return null;
                const { experience, tier, metrics } = item;
                const rankEmojis = ['🥇', '🥈', '🥉'];
                const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

                return (
                  <div
                    key={experience.id}
                    className="bg-white rounded-2xl shadow-xl p-4 relative transform hover:scale-105 transition-all duration-200"
                    style={{ border: `3px solid ${rankColors[index]}` }}
                  >
                    {/* Rank Badge */}
                    <div 
                      className="absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg"
                      style={{ backgroundColor: rankColors[index] }}
                    >
                      {rankEmojis[index]}
                    </div>

                      {/* Experience Info */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{categoryIcons[experience.category] || categoryIcons.Default}</span>
                        <span className="text-sm font-medium px-2 py-1 rounded-full" style={{ 
                          backgroundColor: 'var(--light-peach)', 
                          color: 'var(--yonder-navy)' 
                        }}>
                          {experience.category}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                        {experience.name}
                      </h3>
                      {experience.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {experience.description}
                        </p>
                      )}
                    </div>

                    {/* Value Metrics */}
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold" style={{ color: 'var(--yonder-orange)' }}>
                          £{metrics.valuePerKPoints.toFixed(2)}
                        </div>
                        <div className="text-lg font-medium text-gray-600">
                          per 1,000 points
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-md font-semibold" style={{ color: 'var(--foreground)' }}>
                          {metrics.effectiveReturn.toFixed(1)}% return rate
                        </div>
                      </div>

                     {/* Comparison to Average - Simplified */}
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="text-gray-600">vs average:</span>
                          <span 
                            className="font-bold"
                            style={{ color: metrics.effectiveReturn > averageReturn ? '#10B981' : '#EF4444' }}
                          >
                            {metrics.effectiveReturn > averageReturn ? '+' : ''}
                            {(metrics.effectiveReturn - averageReturn).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Responsive Category Grid - Same order as sections */}
        <div className="mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full justify-center ${
                selectedCategory === null ? 'shadow-xl scale-105' : ''
              }`}
              style={{
                backgroundColor: selectedCategory === null ? 'var(--yonder-navy)' : 'white',
                color: selectedCategory === null ? 'white' : 'var(--foreground)'
              }}
            >
              <span className="text-xl">🌟</span>
              <span className="text-sm">All</span>
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 w-full justify-center ${
                  selectedCategory === category ? 'shadow-xl scale-105' : ''
                }`}
                style={{
                  backgroundColor: selectedCategory === category ? 'var(--yonder-navy)' : 'white',
                  color: selectedCategory === category ? 'white' : 'var(--foreground)'
                }}
              >
                <span className="text-xl">{categoryIcons[category] || categoryIcons.Default}</span>
                <span className="text-sm">{category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Experiences by Category - In the same order as category filter */}
        <div className="space-y-12">
          {categories.map((category) => {
            const categoryExperiences = experiencesByCategory[category] || [];
            if (categoryExperiences.length === 0) return null;
            
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
                      badgeThresholds={badgeThresholds}
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