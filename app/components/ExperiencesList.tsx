// app/components/ExperiencesList.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { UserSettings, loadSettings, saveSettings, getCities } from '../lib/settings';
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
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isCardDropdownOpen, setIsCardDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // Show welcome modal on first visit, hide after settings are saved
  useEffect(() => {
    if (!settings.hasCompletedSetup) {
      setShowSettingsModal(true);
    }
  }, [settings.hasCompletedSetup]);

  useEffect(() => {
    if (settings.hasCompletedSetup) {
      saveSettings(settings);
    }
  }, [settings]);

  const cities = getCities(experiences);
  const selectedCardType = settings.cardType; // For backward compatibility with existing code


  // Filter by city only for badge calculations
  const cityFilteredExperiences = experiences.filter((exp) => 
    exp.city.includes(settings.city)
  );

  // Calculate badge thresholds using city-specific experiences
  const badgeThresholds = useMemo(() => 
    calculateBadgeThresholds(cityFilteredExperiences, selectedCardType), 
    [cityFilteredExperiences, selectedCardType]
  );

  // Then filter by category for display
  const filteredExperiences = cityFilteredExperiences.filter((exp) => 
    selectedCategory ? exp.category === selectedCategory : true
  );

  const categories = getCategories(cityFilteredExperiences);

  if (selectedCategory && !categories.includes(selectedCategory)) {
  setSelectedCategory(null);
  }

  
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
    <div className="full-page-gradient">
      {/* Sticky Header */}
      <div className=" top-0 z-50" > {/* add border-b border-orange-200 to separate header and body */}
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

            {/* Settings Button */}
            <div className="relative">
              {/* Desktop version */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="hidden sm:inline-flex items-center gap-2 bg-white border-2 rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
                style={{ borderColor: 'var(--yonder-orange)' }}
              >
                <span className="text-xl">⚙️</span>
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Settings
                </span>
              </button>

              {/* Mobile version */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="sm:hidden p-2 rounded-full hover:bg-orange-100 transition-colors"
              >
                <span className="text-2xl">⚙️</span>
              </button>

              {/* Settings Dropdown Modal */}
                {showSettingsModal && (
                  <div className="absolute top-full right-0 mt-2 w-80 border-2 rounded-3xl shadow-lg z-50 background-blur-sm" 
                       style={{ borderColor: 'var(--yonder-orange)',
                       backgroundColor: 'rgba(255, 255, 255, 0.97)'
                     }}>
                    <div className="p-6">
                      {/* Welcome message for first-time users */}
                      {!settings.hasCompletedSetup && (
                        <div className="mb-4 text-center">
                          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                            Welcome! Let&apos;s get started.
                          </h2>
                          <p className="text-sm mb-4" style={{ color: 'var(--yonder-navy)', opacity: 0.8 }}>
                            Select your city and card type to see the best redemptions.
                          </p>
                        </div>
                      )}
                      
                      {/* City Selector - Pill Style */}
                      <div className="mb-4">
                      <div className="relative">
                          <div className="inline-flex items-center rounded-full px-3 py-2 w-full" style={{ borderColor: 'var(--yonder-orange)' }}>
                            <span className="text-sm font-medium px-2" style={{ color: 'var(--foreground)' }}>
                              City:
                            </span>
                            
                            {/* City pill inside */}
                            <div className="relative flex-1">
                              <button
                                onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                                className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:shadow-md w-full justify-between"
                                style={{ backgroundColor: 'var(--yonder-orange)' }}
                              >
                                <span className="text-sm">{settings.city}</span>
                                <svg 
                                  className={`w-4 h-4 transition-transform duration-200 ${isCityDropdownOpen ? 'rotate-180' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              
                              {/* City Dropdown */}
                              {isCityDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-white border-2 rounded-xl shadow-lg z-50" style={{ borderColor: 'var(--yonder-orange)' }}>
                                  {cities.map((city) => (
                                    <button
                                      key={city}
                                      onClick={() => {
                                        setSettings(prev => ({ ...prev, city }));
                                        setIsCityDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-3 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl ${
                                        settings.city === city ? 'text-white' : 'hover:bg-orange-50'
                                      }`}
                                      style={{ 
                                        backgroundColor: settings.city === city ? 'var(--yonder-orange)' : 'transparent',
                                        color: settings.city === city ? 'white' : 'var(--foreground)'
                                      }}
                                    >
                                      <div className="font-semibold">{city}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Type Selector - Pill Style */}
                      <div className="mb-6">
                       <div className="relative">
                          <div className="inline-flex items-center rounded-full px-3 py-2 w-full" style={{ borderColor: 'var(--yonder-orange)' }}>
                            <span className="text-sm font-medium px-2" style={{ color: 'var(--foreground)' }}>
                              My Card:
                            </span>
                            
                            {/* Card pill inside */}
                            <div className="relative flex-1">
                              <button
                                onClick={() => setIsCardDropdownOpen(!isCardDropdownOpen)}
                                className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:shadow-md w-full justify-between"
                                style={{ backgroundColor: 'var(--yonder-orange)' }}
                              >
                                <span className="text-sm">{selectedCard?.name}</span>
                                <svg 
                                  className={`w-4 h-4 transition-transform duration-200 ${isCardDropdownOpen ? 'rotate-180' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              
                              {/* Card Dropdown */}
                              {isCardDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-white border-2 rounded-xl shadow-lg z-50" style={{ borderColor: 'var(--yonder-orange)' }}>
                                  {Object.entries(CARD_TYPES).map(([key, cardType]) => (
                                    <button
                                      key={key}
                                      onClick={() => {
                                        setSettings(prev => ({ ...prev, cardType: key as CardType }));
                                        setIsCardDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-3 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl ${
                                        settings.cardType === key ? 'text-white' : 'hover:bg-orange-50'
                                      }`}
                                      style={{ 
                                        backgroundColor: settings.cardType === key ? 'var(--yonder-orange)' : 'transparent',
                                        color: settings.cardType === key ? 'white' : 'var(--foreground)'
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
                        </div>
                      </div>

                      {/* Save Button - Different text for first-time vs returning users */}
                      <button
                        onClick={() => {
                          const updatedSettings = { ...settings, hasCompletedSetup: true };
                          setSettings(updatedSettings);
                          saveSettings(updatedSettings);
                          setShowSettingsModal(false);
                          setIsCardDropdownOpen(false);
                          setIsCityDropdownOpen(false);
                        }}
                        className="w-full py-3 rounded-full font-semibold text-white transition-all duration-200 hover:shadow-lg"
                        style={{ backgroundColor: 'var(--yonder-orange)' }}
                      >
                        {!settings.hasCompletedSetup ? "Let's get started! 🚀" : "Save Settings"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Click outside handler */}
                {showSettingsModal && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => {
                      setShowSettingsModal(false);
                      setIsCardDropdownOpen(false);
                      setIsCityDropdownOpen(false);
                    }}
                  />
                )}
                            </div>
                          </div>
                        </div>
                      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8"> 
         <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 mb-12" style={{ paddingBottom: '8rem'}}> {/* Extra padding to create overlap */}
          <div className="px-4 sm:px-6 lg:px-8 py-12 text-center justify-center">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-serif font-semibold max-w-4xl mx-auto" style={{ color: 'var(--foreground)' }}>
              Find the best-value redemptions for your points
            </h1>
            <p className="pt-6 py-6 text-2xl sm:text-2xl md-text-4xl mt-4 max-w-3xl mx-auto" style={{ color: 'var(--yonder-navy)', opacity: 0.8 }}>
                Explore this month&apos;s best redemptions, compare value across experiences, and make sure you get the best return from your points.
            </p>
          </div>
        </div>

        {/* Top 3 Overall Best Redemptions */}
        <div className="max-w-6xl mx-auto mb-14 -mt-50">
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

        {/* Responsive Category Buttons Grid */}
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
            const displayExperiences = isExpanded ? categoryExperiences : categoryExperiences.slice(0, 4);
            const hasMore = categoryExperiences.length > 3;

            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-8 mt-8">
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3 flex-1" style={{ color: 'var(--foreground)' }}>
                    <span className="text-2xl sm:text-3xl">{categoryIcons[category] || categoryIcons.Default}</span>
                    <span>{category}</span>
                    <span className="text-sm sm:text-lg font-normal px-2 sm:px-3 py-1 rounded-full text-white flex-shrink-0" style={{ backgroundColor: 'var(--yonder-orange)' }}>
                      {categoryExperiences.length}
                    </span>
                  </h2>
                  
                  {hasMore && (
                    <button
                      onClick={() => toggleCategoryExpansion(category)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 text-sm whitespace-nowrap ml-2"
                      style={{
                        backgroundColor: 'var(--light-peach)',
                        color: 'var(--yonder-navy)',
                      }}
                    >
                      <span className="hidden sm:inline">
                      {isExpanded ? '🔼 Show Less' : `🔽 Show All ${categoryExperiences.length}`}
                      </span>
                      <span className="sm:hidden">
                        {isExpanded ? '🔼' : '🔽'}
                      </span>
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
                      Show {categoryExperiences.length - 4} more {category.toLowerCase()} experiences
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
        <div className="mt-16 pt-8 pb-4 border-t border-gray-300">
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