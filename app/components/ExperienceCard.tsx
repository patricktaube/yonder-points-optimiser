// app/components/ExperienceCard.tsx
'use client';

import { useMemo, useState, useRef } from 'react';
import { Experience, calculateValueMetrics, CardType, BadgeThresholds, getExperienceBadge, CONSTANTS } from '../lib/experiences';

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

  // One rate per experience now, so this is just the value maths + badge.
  const { metrics, badgeType } = useMemo(() => ({
    metrics: calculateValueMetrics(experience, selectedCardType),
    badgeType: badgeThresholds
      ? getExperienceBadge(experience, selectedCardType, badgeThresholds)
      : null,
  }), [experience, selectedCardType, badgeThresholds]);

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

  const badgeStyle = {
    position: 'absolute' as const,
    top: CONSTANTS.BADGE_POSITION_OFFSET.TOP,
    right: CONSTANTS.BADGE_POSITION_OFFSET.RIGHT,
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    zIndex: 10
  };

  switch (badgeType) {
    case 'best-value':
      return (
        <div 
          className="absolute text-white text-sm font-bold rounded-full shadow-lg z-10 flex items-center justify-center"
          style={{ 
            ...badgeStyle,
            backgroundColor: 'var(--badge-sage)',
          }}
        >
          {/* Use Tailwind responsive classes instead of window.innerWidth */}
          <span className="sm:hidden">👍</span>
          <span className="hidden sm:inline">Great Value</span>
        </div>
      );
    case 'bad-deal':
      return (
        <div 
          className="absolute text-white text-sm font-bold rounded-full shadow-lg z-10 flex items-center justify-center"
          style={{ 
            ...badgeStyle,
            backgroundColor: 'var(--badge-red)',
          }}
        >
          <span className="sm:hidden">👎</span>
          <span className="hidden sm:inline">Bad Deal</span>
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
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        outline: "none",
        backgroundClip: "padding-box"
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
          backgroundColor: "var(--yonder-orange)", // Darker peach
        }}
      >
        <h3 className="text-lg font-bold line-clamp-2" style={{ color: '#ffffff' }}>
          {experience.name}
        </h3>
      </div>

      {/* Main Value Display */}
      <div className="text-center py-1 px-1 rounded-xl mb-1" style={{ backgroundColor: 'var(--light-peach)' }}>
        <div className="text-3xl font-black mb-1" style={{ color: 'var(--yonder-navy)' }}>
          £{metrics.valuePerKPoints.toFixed(2)}
        </div>
        <div className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
          per 1,000 points
        </div>
        <div className="text-sm font-medium" style={{ color: 'var(--yonder-orange)' }}>
          {metrics.effectiveReturn.toFixed(1)}% return rate
        </div>
      </div>
    </div>
  );
}