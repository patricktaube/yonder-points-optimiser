// app/components/ExperienceCard.tsx
'use client';

import { Experience, calculateEffectiveReturn } from '../lib/airtable';

interface ExperienceCardProps {
  experience: Experience;
  isPaidTier: boolean;
  isBestInCategory: boolean;
}

export default function ExperienceCard({
  experience,
  isPaidTier,
  isBestInCategory,
}: ExperienceCardProps) {
  // Check if redemption rates are linear
  const isLinear = experience.redemptionTiers.length >= 2 &&
    experience.redemptionTiers.every((tier, index) => {
      if (index === 0) return true;
      return Math.abs(tier.per1000Points - experience.redemptionTiers[0].per1000Points) < 0.01;
    });

  // Find best tier if not linear
  const bestTier = !isLinear
    ? experience.redemptionTiers.reduce((best, current) =>
        current.per1000Points > best.per1000Points ? current : best
      )
    : null;

  // Get value color
  const getValueColor = (per1000Points: number) => {
    if (per1000Points >= 10) return 'text-green-600';
    if (per1000Points >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getValueBgColor = (per1000Points: number) => {
    if (per1000Points >= 10) return 'bg-green-50 border-green-200';
    if (per1000Points >= 7) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 relative">
      {isBestInCategory && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          Best Value
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{experience.name}</h3>
      
      {experience.description && (
        <p className="text-sm text-gray-600 mb-3">{experience.description}</p>
      )}

      <div className="space-y-3">
        {experience.redemptionTiers.map((tier) => {
          const effectiveReturn = calculateEffectiveReturn(tier.per1000Points, isPaidTier);
          const isThisBestTier = bestTier && tier.id === bestTier.id;

          return (
            <div
              key={tier.id}
              className={`border rounded-lg p-3 ${
                isThisBestTier ? getValueBgColor(tier.per1000Points) : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {tier.pointsRequired.toLocaleString()} points → £{tier.poundValue}
                  </div>
                  <div className={`text-xs mt-1 ${getValueColor(tier.per1000Points)}`}>
                    £{tier.per1000Points.toFixed(2)} per 1,000 points
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Effective return</div>
                  <div className={`text-sm font-semibold ${getValueColor(tier.per1000Points)}`}>
                    {effectiveReturn.toFixed(1)}%
                  </div>
                </div>
              </div>
              {isThisBestTier && !isLinear && (
                <div className="mt-2 text-xs font-medium text-green-700">
                  ★ Best tier for this experience
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isLinear && (
        <div className="mt-3 text-xs text-gray-500 italic">
          ⚠️ Non-linear redemption rates - consider the highlighted tier
        </div>
      )}
    </div>
  );
}