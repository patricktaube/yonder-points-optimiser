// app/components/ExperienceCard.tsx
import { ValueLabel } from '../lib/experiences';

export type LineTone = 'good' | 'note' | 'muted';

export interface ExperienceCardProps {
  name: string;
  value: string;     // "£45.30", what 10,000 points are worth
  line: string;      // "From 17,670 points", "You can get £80 now (17,670 pts)", ...
  lineTone: LineTone;
  label: ValueLabel;
  className?: string;
}

export const toneClass: Record<LineTone, string> = {
  good: 'text-good',
  note: 'text-note',
  muted: 'text-muted',
};

// One experience. On phones it's a row in a list (name on the left, value on
// the right). From the `lg` breakpoint it becomes a tile in a 5-column grid.
// It's the same markup either way: `lg:contents` drops the left wrapper's box
// so its children join the tile directly, and `order` puts them in place.
export default function ExperienceCard({ name, value, line, lineTone, label, className = '' }: ExperienceCardProps) {
  const poor = label === 'Poor value';

  return (
    <li className={`${className} flex items-center gap-2.5 border-t border-line py-[13px] lg:min-h-32 lg:flex-col lg:items-stretch lg:gap-0 lg:rounded-[18px] lg:border lg:border-card-line lg:bg-tile lg:px-4 lg:py-3.5`}>
      <div className="min-w-0 flex-1 lg:contents">
        <div className="text-base font-bold lg:order-1 lg:min-h-[38px] lg:text-[15px] lg:leading-tight">{name}</div>
        <div className={`text-[13px] font-semibold lg:order-3 lg:mt-0.5 lg:text-xs ${toneClass[lineTone]}`}>{line}</div>
        {label && (
          <div className="mt-[5px] lg:order-4 lg:mt-auto lg:pt-2">
            <span
              className={`inline-block whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11px] font-extrabold ${
                poor ? 'bg-poor-bg text-poor' : 'bg-good-bg text-good'
              }`}
            >
              {label}
            </span>
          </div>
        )}
      </div>
      <div className="whitespace-nowrap text-right lg:order-2 lg:mt-1.5 lg:flex lg:items-baseline lg:gap-1.5 lg:text-left">
        <div className={`text-lg font-extrabold lg:text-2xl ${poor ? 'text-poor' : ''}`}>{value}</div>
        <div className="text-[11px] text-muted lg:text-xs">
          <span className="lg:hidden">per 10k pts</span>
          <span className="hidden lg:inline">/ 10k pts</span>
        </div>
      </div>
    </li>
  );
}
