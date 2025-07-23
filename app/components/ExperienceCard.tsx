// app/components/ExperienceCard.tsx
'use client';

import { Experience, calculateValueMetrics, getBestTier, CardType } from '../lib/airtable';

interface ExperienceCardProps {
  experience: Experience;
  selectedCardType: CardType;
  isBestInCategory: boolean;
  isUniquelyBest: boolean;
}

export default function ExperienceCard({
  experience,
  selectedCardType,
  isBestInCategory,
  isUniquelyBest,
}: ExperienceCardProps) {
  // Check if redemption rates are linear
  const valueMetrics = experience.redemptionTiers.map(tier => 
    calculateValueMetrics(tier, selectedCardType)
  );

  const isLinear = valueMetrics.length >= 2 &&
    valueMetrics.every((metrics, index) => {
      if (index === 0) return true;
      return Math.abs(metrics.valuePerKPoints - valueMetrics[0].valuePerKPoints) < 0.01;
    });

  // Get best tier value for display
  const bestTier = getBestTier(experience.redemptionTiers, selectedCardType);
  const bestMetrics = bestTier ? calculateValueMetrics(bestTier, selectedCardType) : null;

  // Format tiers display
  const tiersDisplay = experience.redemptionTiers
    .sort((a, b) => a.pointsRequired - b.pointsRequired)
    .map(tier => `${(tier.pointsRequired / 1000).toFixed(0)}k→£${tier.poundValue}`)
    .join(' | ');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 relative hover:shadow-md transition-shadow">
      {isBestInCategory && isUniquelyBest && (
        <div className="absolute -top-2 -right-2 bg-green-700 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
          Best Value
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left side - Experience info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-800 mb-1 truncate">
            {experience.name}
          </h3>
          {experience.description && (
            <p className="text-sm text-slate-600 mb-2 line-clamp-2">
              {experience.description}
            </p>
          )}
          <div className="text-xs text-slate-500">
            Tiers: {tiersDisplay}
          </div>
          {!isLinear && (
            <div className="text-xs text-orange-600 font-medium mt-1">
              ⚠️ Non-linear rates
            </div>
          )}
        </div>

        {/* Right side - Value metrics */}
        {bestMetrics && (
          <div className="flex flex-col sm:items-end text-right shrink-0">
            <div className="text-lg font-bold text-blue-900">
              £{bestMetrics.valuePerKPoints.toFixed(2)} per 1,000 points
            </div>
            <div className="text-sm text-slate-500">
              {bestMetrics.effectiveReturn.toFixed(1)}% return
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Spend £{bestMetrics.poundsToSpend.toFixed(0)} to earn
            </div>
          </div>
        )}
      </div>
    </div>
  );
}