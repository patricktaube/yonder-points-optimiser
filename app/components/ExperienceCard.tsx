// app/components/ExperienceCard.tsx
'use client';

import { use, useMemo, useState, useRef } from 'react';   
import { Experience, calculateValueMetrics, getBestTier, CardType, BadgeThresholds, getExperienceBadge } from '../lib/airtable';

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
  // Cursor tracking state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const memoizedMetrics = useMemo(() => {
    const valueMetrics = experience.redemptionTiers.map(tier => 
      calculateValueMetrics(tier, selectedCardType)
    );

    // Check if redemption rates are linear
    const isLinear = valueMetrics.length >= 2 &&
      valueMetrics.every((metrics, index) => {
        if (index === 0) return true;
        return Math.abs(metrics.valuePerKPoints - valueMetrics[0].valuePerKPoints) < 0.05; // Allow small floating point errors
      });

      if (!isLinear && valueMetrics.length >= 2) {
  console.log('Non-linear detected for:', experience.name);
  console.log('Redemption tiers:', experience.redemptionTiers);
  console.log('Value metrics:', valueMetrics.map((m, i) => ({
    tier: i + 1,
    valuePerKPoints: m.valuePerKPoints,
    diff: i === 0 ? 0 : Math.abs(m.valuePerKPoints - valueMetrics[0].valuePerKPoints)
  })));
}

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

  // Cursor tracking handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };
  
  // Render badge
  const renderBadge = () => {
    if (!badgeType) return null;

    switch (badgeType) {
      case 'best-value':
        return (
          <div 
            className="absolute -top-4 -right-3 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg z-10"
            style={{ backgroundColor: 'var(--badge-sage)' }}
          >
            Great Value
          </div>
        );
      case 'bad-deal':
        return (
          <div 
            className="absolute -top-4 -right-3 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg z-10"
            style={{ backgroundColor: 'var(--badge-red)' }}
          >
            Bad Deal
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="rounded-2xl p-4 relative hover:shadow-xl transition-all duration-300 hover:scale-102 cursor-pointer"
      style={{ 
        backgroundColor: 'var(--card-background)',
        border: `2px solid var(--border-color)`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}
    >
      {/* Cursor glow effect - desktop only */}
      {isHovered && (
        <div
          className="absolute pointer-events-none transition-opacity duration-300 hidden md:block"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      {renderBadge()}

      {/* Darker Peach Title Bar */}
      <div 
        className="-mx-4 -mt-4 px-4 py-3 mb-3 rounded-t-xl"
        style={{ 
          backgroundColor: '#f4b885', // Darker peach
        }}
      >
        <h3 className="text-lg font-bold line-clamp-2" style={{ color: 'var(--yonder-navy)' }}>
          {experience.name}
        </h3>
      </div>

      {/* Rest of content stays the same */}
      {experience.description && (
        <p className="text-sm leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
          {experience.description}
        </p>
      )}

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