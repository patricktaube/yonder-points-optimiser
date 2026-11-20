// app/components/SettingsMenu.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { CARD_TYPES, CardType } from '../lib/experiences';
import { UserSettings } from '../lib/settings';

interface SettingsMenuProps {
  settings: UserSettings;
  cities: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: UserSettings) => void;
}

// The header pill ("London") and the panel it opens. On phones the panel is a
// bottom sheet; from the `sm` breakpoint up it drops down under the pill.
// Choices are a draft until "Save settings", so closing the panel discards them.
export default function SettingsMenu({ settings, cities, open, onOpenChange, onSave }: SettingsMenuProps) {
  const [draft, setDraft] = useState(settings);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstVisit = !settings.hasCompletedSetup;

  // Start each opening from the saved settings.
  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  // Escape closes the panel; focus moves into it when it opens.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const pill = (selected: boolean) =>
    `min-h-[42px] px-3.5 rounded-full border-[1.5px] text-sm font-bold cursor-pointer ${
      selected ? 'bg-navy text-white border-navy' : 'bg-white text-navy border-line hover:border-orange'
    }`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Settings: ${settings.city}, ${CARD_TYPES[settings.cardType].name}`}
        className="inline-flex items-center gap-2 min-h-11 px-3.5 sm:px-[18px] rounded-full shrink-0 border-2 border-orange bg-white text-[13px] sm:text-sm font-bold text-navy cursor-pointer shadow-[0_8px_18px_-10px_rgba(180,83,26,0.5)]"
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h10" /><path d="M18 7h2" /><circle cx="16" cy="7" r="2" />
          <path d="M4 17h4" /><path d="M12 17h8" /><circle cx="10" cy="17" r="2" />
        </svg>
        <span className="whitespace-nowrap">{settings.city}</span>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={open ? 'rotate-180' : ''}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop: dims the page on phones, invisible but clickable above */}
          <div className="fixed inset-0 z-40 bg-navy/45 sm:bg-transparent" onClick={() => onOpenChange(false)} aria-hidden="true" />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[26px] bg-white px-5 pt-2.5 pb-7 shadow-[0_-20px_40px_rgba(0,0,0,0.15)] outline-none
                       sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] sm:rounded-[24px] sm:border sm:border-card-line sm:p-6 sm:shadow-[0_28px_56px_-28px_rgba(30,41,59,0.45)]"
          >
            <div aria-hidden="true" className="mx-auto mb-3.5 h-[5px] w-10 rounded-full bg-[#e2d6cb] sm:hidden" />
            <h2 id="settings-title" className="m-0 text-[19px] font-extrabold">
              {firstVisit ? "Welcome! Let's get started" : 'Your settings'}
            </h2>
            {firstVisit && (
              <p className="mt-1 mb-0 text-sm text-muted">Pick your city and card to see the best redemptions.</p>
            )}

            <fieldset className="mt-4 border-0 p-0">
              <legend className="mb-2 p-0">
                <span className="block text-[15px] font-extrabold">City</span>
                <span className="block text-[13px] text-muted">Where you use your points most</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    aria-pressed={draft.city === city}
                    onClick={() => setDraft((d) => ({ ...d, city }))}
                    className={pill(draft.city === city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-4 border-0 p-0">
              <legend className="mb-2 p-0">
                <span className="block text-[15px] font-extrabold">Card</span>
                <span className="block text-[13px] text-muted">The Yonder card you have</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CARD_TYPES) as CardType[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={draft.cardType === key}
                    onClick={() => setDraft((d) => ({ ...d, cardType: key }))}
                    className={pill(draft.cardType === key)}
                  >
                    {CARD_TYPES[key].name}
                  </button>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={() => onSave({ ...draft, hasCompletedSetup: true })}
              className="mt-6 w-full min-h-[52px] rounded-full border-0 bg-navy text-base font-extrabold text-white cursor-pointer"
            >
              {firstVisit ? "Let's go" : 'Save settings'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
