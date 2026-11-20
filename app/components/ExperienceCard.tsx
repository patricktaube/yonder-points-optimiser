// app/components/ExperienceCard.tsx
import { ValueLabel } from '../lib/experiences';

export type LineTone = 'good' | 'note' | 'muted';

export interface ExperienceCardProps {
  name: string;
  value: number;      // £ per 10,000 points, e.g. 45.3
  line: string;       // "From 17,670 points", "You can get £80 now (17,670 pts)", ...
  lineTone: LineTone;
  label: ValueLabel;
  diffPct: number;    // how far from the city average, in %, always positive
  handFont: boolean;  // true once the handwritten font may be used (see ExperiencesList)
  className?: string;
}

export const toneClass: Record<LineTone, string> = {
  good: 'text-good',
  note: 'text-note',
  muted: 'text-muted',
};

// One experience, styled as a menu card: a big serif price with a small "£"
// and pence, and a handwritten note when it's far above or below average.
//
// On phones it's a row in a list (name on the left, price on the right).
// From the `lg` breakpoint it becomes a beige tile in a 5-column grid, with
// the price at the bottom left and the note at the bottom right.
export default function ExperienceCard({
  name,
  value,
  line,
  lineTone,
  label,
  diffPct,
  handFont,
  className = '',
}: ExperienceCardProps) {
  const great = label === 'Great value';
  const poor = label === 'Poor value';
  const [whole, pence] = value.toFixed(2).split('.');
  const valueColour = great ? 'text-good' : poor ? 'text-poor' : 'text-navy';

  return (
    <li
      className={`${className} flex items-center gap-3 border-t border-line py-3.5 lg:flex-col lg:items-stretch lg:gap-0 lg:rounded-[14px] lg:border-0 lg:bg-tile lg:px-[18px] lg:pt-4 lg:pb-3.5`}
    >
      <div className="min-w-0 flex-1 lg:flex-none">
        <div className="text-[17px] font-extrabold leading-tight tracking-[-0.015em] lg:min-h-[42px] lg:text-lg lg:leading-[1.15]">
          {name}
        </div>
        <div className={`mt-0.5 text-xs font-semibold lg:mt-1 ${toneClass[lineTone]}`}>{line}</div>
      </div>

      <div className="whitespace-nowrap text-right lg:mt-auto lg:flex lg:items-end lg:justify-between lg:gap-1.5 lg:pt-3.5 lg:text-left">
        <div>
          <span className={`inline-flex items-start font-serif font-bold leading-[0.9] ${valueColour}`}>
            {/* Lobster Two's "£" looks like "Ł", so the symbol uses Manrope. */}
            <span className="mt-[3px] font-sans text-[15px] font-extrabold lg:mt-1 lg:text-xl">£</span>
            <span className="text-[30px] lg:text-[40px]">{whole}</span>
            <span className="mt-[3px] text-[15px] lg:mt-1 lg:text-xl">.{pence}</span>
          </span>
          <div className="mt-0.5 text-[11px] font-semibold text-muted lg:mt-1">per 10k points</div>
        </div>
        {(great || poor) && (
          <div
            className={`mt-[3px] text-[17px] font-semibold leading-none -rotate-3 lg:mt-0 lg:pb-1 lg:text-right lg:text-[19px] lg:-rotate-[4deg] ${
              handFont ? 'font-hand' : 'italic'
            } ${great ? 'text-good' : 'text-poor'}`}
          >
            <span aria-hidden="true">{great ? '↑' : '↓'}</span> {diffPct}% {great ? 'above' : 'below'} avg
          </div>
        )}
      </div>
    </li>
  );
}
