// app/components/ExperiencesList.tsx
'use client';

import { useState } from 'react';
import { useMemo } from 'react';
import { Experience, getCategories, calculateValueMetrics, getBestTier, CARD_TYPES, CardType, calculateBadgeThresholds } from '../lib/airtable';
import ExperienceCard from './ExperienceCard';
import Link from 'next/link';

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
  'Fit&Well': '💪',
  'Theatre': '🎭',
  'Lounges': '🛋️',
  'Treats': '🥐',
  "Pubs": "🍻",
  'Wellness': '🧘',
  'Default': '🎉'
};

export default function ExperiencesList({ experiences }: ExperiencesListProps) {
  const [selectedCardType, setSelectedCardType] = useState<CardType>('credit_paid');
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

{/* ------------------------------ */}
{/* Header */}
{/* ------------------------------ */}

  return (
    <div style={{ backgroundColor: '#fef7f0' }} className="min-h-screen">
      {/* Sticky Header */}
      <div className=" top-0 z-50 " style={{ backgroundColor: '#ffe5cc' }}> {/* add border-b border-orange-200 to separate header and body */}
        {/* <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4"> */}
       <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center"> {/* add max-w-6xl mx-auto to retain padding */} 
            {/* Left side - FAQ */}
             <div className="flex items-center">
                <Link 
                href="/faq" 
                className="text-sm font-medium px-4 py-2 rounded-full hover:bg-orange-100 transition-colors"
                style={{ color: 'var(--foreground)' }}
                >
                FAQ
                </Link>
        </div>
            
            {/* Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
                <h1 className="text-2xl sm:text-4xl font-bold text-center" style={{ color: 'var(--foreground)' }}>
                 Yonder Points Optimiser
                </h1>
            </div>

            {/* ------------------------------ */}
            {/* Pill-style Card Type Selector */}
            {/* ------------------------------ */}

            <div className="relative">
              {/* Desktop version - Large pill container */}
              <div className="hidden sm:inline-flex items-center bg-white border-2 rounded-full px-3 py-2 shadow-lg" style={{ borderColor: 'var(--yonder-orange)' }}>
                <span className="text-sm font-medium px-2" style={{ color: 'var(--foreground)' }}>
                  My Card:
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
                </div>
              </div>

              {/* Mobile version - Compact pill with card icon */}
              <div className="sm:hidden">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 text-white font-semibold px-3 py-2 rounded-full transition-all duration-200 hover:shadow-md shadow-lg"
                  style={{ backgroundColor: 'var(--yonder-orange)' }}
                >
                  <span className="text-base">💳</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Dropdown menu - same for both desktop and mobile */}
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

              {/* Click outside handler */}
              {isDropdownOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>


{/* ------------------------------ */}
{/* Main Content */}
{/* ------------------------------ */}

      <div className="px-4 sm:px-6 lg:px-8"> 
         <div className="hero-gradient-background relative -mx-4 sm:-mx-6 lg:-mx-8 mb-12" style={{ paddingBottom: '8rem'}}> {/* Extra padding to create overlap */}
          <div className="px-4 sm:px-6 lg:px-8 py-12 text-center justify-center">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-serif font-semibold max-w-4xl mx-auto" style={{ color: 'var(--foreground)' }}>
              Find the best-value redemptions for your points
            </h1>
            <p className="pt-6 py-6 text-2xl sm:text-2xl md-text-4xl mt-4 max-w-3xl mx-auto" style={{ color: 'var(--yonder-navy)', opacity: 0.8 }}>
                Explore this month&apos;s best redemptions, compare value across experiences, and make sure you get the best return from your points.
            </p>
          </div>
        </div>

        {/* ------------------------------ */}
        {/* Top 3 Overall Best Redemptions */}
        {/* ------------------------------ */}

        <div className="max-w-6xl mx-auto mb-14 -mt-35">
          <div className="bg-white rounded-3xl p-6 sm:p-8 pb-8 sm:pb-12 shadow-lg border border-orange-100 relative z-10">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                    This month&apos;s best redemption rates
                </h2>
            </div>

          <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
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
                    style={{ border: `2px solid ${rankColors[index]}` }}
                  >
                    {/* Rank Badge */}
                    <div 
                      className="absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg"
                      style={{ backgroundColor: rankColors[index] }}
                    >
                      {rankEmojis[index]}
                    </div>

                      {/* Experience Info */}
                    <div className="mb-1">
                      <div className="flex items-center gap-2 mb-1">
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
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
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
                          {metrics.effectiveReturn.toFixed(1)}% return, 
                          <span 
                            className="font-bold"
                            style={{ color: metrics.effectiveReturn > averageReturn ? '#10B981' : '#EF4444' }}
                          >
                            {(metrics.effectiveReturn - averageReturn).toFixed(1)}% 
                            {metrics.effectiveReturn > averageReturn ? ' more than average' : ''}

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
        </div>

        {/* ------------------------------ */}
        {/* Responsive Category Buttons Grid */}
        {/* ------------------------------ */}

        <div className="max-w-4xl mx-auto mb-14">
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-center">
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
        <div className="max-w-6xl mx-auto space-y-12">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-orange-100">
                  <div className="text-center mb-6">
                    {/* <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                        All experiences by category
                    </h2> */}
                  </div>



          {categories.map((category) => {
            const categoryExperiences = experiencesByCategory[category] || [];
            if (categoryExperiences.length === 0) return null;
            
            const isExpanded = expandedCategories.has(category);
            const displayExperiences = isExpanded ? categoryExperiences : categoryExperiences.slice(0, 3);
            const hasMore = categoryExperiences.length > 3;

            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-8 mt-8">
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
                      }}
                    >
                      {isExpanded ? '🔼 Show Less' : `🔽 Show All ${categoryExperiences.length}`}
                    </button>
                  )}
                </div>

                <div className="grid gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
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
                      Show {categoryExperiences.length - 3} more {category.toLowerCase()} experiences
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
        
        {/* Legal Disclaimer */}
        <div className="mt-16 pt-8 border-t border-gray-300">
          <p className="text-center text-sm text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Made with ❤️ for the Yonder community.
            <br />
            <br />
            This is an unofficial, third-party tool not affiliated with or endorsed by Yonder Technology Ltd. 
            All Yonder trademarks and service marks belong to Yonder Technology Ltd. 
            This tool is provided for informational purposes only.
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}