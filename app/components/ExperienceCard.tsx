// app/components/ExperienceCard.tsx
'use client';

import { use, useMemo } from 'react';   
import { Experience, calculateValueMetrics, getBestTier, CardType, BadgeThresholds, getExperienceBadge, getValueEmoji } from '../lib/airtable';

interface ExperienceCardProps {
  experience: Experience;
  selectedCardType: CardType;
  badgeThresholds?: BadgeThresholds;
}

export default function ExperienceCard({
  experience,
  selectedCardType,
  badgeThresholds,
}: ExperienceCardProps) {
    const memoizedMetrics = useMemo(() => {
        const valueMetrics = experience.redemptionTiers.map(tier => 
            calculateValueMetrics(tier, selectedCardType)
        );

  // Check if redemption rates are linear
    const isLinear = valueMetrics.length >= 2 &&
    valueMetrics.every((metrics, index) => {
      if (index === 0) return true;
      return Math.abs(metrics.valuePerKPoints - valueMetrics[0].valuePerKPoints) < 0.01;
    });

  // Get best tier value for display
  const bestTier = getBestTier(experience.redemptionTiers, selectedCardType);
  const bestMetrics = bestTier ? calculateValueMetrics(bestTier, selectedCardType) : null;

  // Get badge type
  const badgeType = badgeThresholds ? getExperienceBadge(
    experience, 
    selectedCardType, 
    badgeThresholds, 
  ): null ;

   return {
      isLinear,
      bestTier,
      bestMetrics,
      badgeType
    };
  }, [experience, selectedCardType, badgeThresholds]);

  const { isLinear, bestMetrics, badgeType } = memoizedMetrics;
  
  // Render badge
  const renderBadge = () => {
    if (!badgeType) return null;

    switch (badgeType) {
      case 'best-value':
        return (
          <div 
            className="absolute -top-4 -right-3 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg"
            style={{ backgroundColor: '#10B981' }}
          >
            🏆 Great Value
          </div>
        );
      case 'bad-deal':
        return (
          <div 
            className="absolute -top-4 -right-3 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg"
            style={{ backgroundColor: '#EF4444' }}
          >
            ⚠️ Bad Deal
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="rounded-2xl p-4 relative hover:shadow-xl transition-all duration-300 hover:scale-102 cursor-pointer"
      style={{ 
        backgroundColor: 'var(--card-background)',
        border: `2px solid var(--border-color)`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}
    >
      {renderBadge()}

      {/* Experience Name with Emoji */}
      <div className="mb-1">
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          {bestMetrics && (
            <span className="text-2xl">{getValueEmoji(bestMetrics.effectiveReturn)}</span>
          )}
          <span className="line-clamp-2">{experience.name}</span>
        </h3>
        
        {experience.description && (
          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            {experience.description}
          </p>
        )}
      </div>

      {/* Main Value Display */}
      {bestMetrics && (
        <div className="text-center py-1 px-1 rounded-xl mb-1" style={{ backgroundColor: 'var(--light-peach)' }}>
          <div className="text-3xl font-black mb-1" style={{ color: 'var(--yonder-navy)' }}>
            £{bestMetrics.valuePerKPoints.toFixed(2)}
          </div>
          <div className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
            per 1,000 points
          </div>
          <div className="text-sm font-medium" style={{ color: 'var(--yonder-orange)' }}>
            {bestMetrics.effectiveReturn.toFixed(1)}% return rate
          </div>
        </div>
      )}

      {/* Tier Information */}
      <div className="space-y-2">
        {!isLinear && (
          <div className="flex items-center gap-2 text-xs font-semibold mt-2 px-3 py-1 rounded-full" style={{ 
            backgroundColor: 'rgba(218, 97, 32, 0.1)',
            color: 'var(--yonder-orange)' 
          }}>
            <span>⚠️</span>
            <span>Non-linear rates - check tiers carefully</span>
          </div>
        )}
      </div>
    </div>
  );
}