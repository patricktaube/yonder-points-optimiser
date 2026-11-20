// app/components/ExperiencesList.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { UserSettings, DEFAULT_SETTINGS, loadSettings, saveSettings, getCities } from '../lib/settings';
import {
  Experience,
  Tier,
  ValueLabel,
  averageValuePer10k,
  formatPoints,
  formatPounds,
  getBestAffordableTier,
  getCategories,
  getCategoryIcon,
  getTiers,
  getValueLabel,
  valuePer10k,
} from '../lib/experiences';
import ExperienceCard, { LineTone, toneClass } from './ExperienceCard';
import SettingsMenu from './SettingsMenu';

interface ExperiencesListProps {
  experiences: Experience[];
  monthLabel: string; // e.g. "November 2025", the month these rates are for
}

// Experiences shown per category before "Show N more": one row of the
// desktop grid is 5 tiles, so 10 is two full rows. Phones show a shorter list.
const VISIBLE_DESKTOP = 10;
const VISIBLE_MOBILE = 7;
const BOARD_SIZE = 5;
const QUICK_PICKS = [5000, 10000, 25000, 50000];

// One experience with everything the page needs, worked out once.
interface Rated {
  exp: Experience;
  value: number; // £ per 10,000 points
  tiers: Tier[];
  label: ValueLabel;
}

interface Line {
  text: string;
  tone: LineTone;
}

const money = (value: number) => `£${value.toFixed(2)}`;

export default function ExperiencesList({ experiences, monthLabel }: ExperiencesListProps) {
  // Start from the defaults so the first browser render matches the
  // server-rendered HTML (the server can't see localStorage). Saved settings
  // load in the effect below, which only runs in the browser.
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rawBalance, setRawBalance] = useState('');
  const [onlyAffordable, setOnlyAffordable] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [handFont, setHandFont] = useState(false);

  // Load saved settings once. First-time visitors get the welcome panel.
  useEffect(() => {
    const saved = loadSettings();
    setSettings(saved);
    if (!saved.hasCompletedSetup) setSettingsOpen(true);
  }, []);

  // The handwritten font (Caveat, 50 KB) is only used for the "city average"
  // notes below the fold. A browser downloads a font as soon as any text uses
  // it, which made it compete with the critical files and slowed first paint
  // on mobile. So the notes switch to it only once the page has loaded.
  useEffect(() => {
    const enable = () => setHandFont(true);
    if (document.readyState === 'complete') enable();
    else window.addEventListener('load', enable, { once: true });
    return () => window.removeEventListener('load', enable);
  }, []);

  const handleSave = (next: UserSettings) => {
    setSettings(next);
    saveSettings(next);
    setSettingsOpen(false);
  };

  const city = settings.city;
  const monthName = monthLabel.split(' ')[0];                     // "November"
  const shortMonth = `${monthName.slice(0, 3)} ${monthLabel.split(' ')[1] ?? ''}`.trim(); // "Nov 2025"
  const balance = parseInt(rawBalance.replace(/[^0-9]/g, ''), 10) || 0;
  const filtering = onlyAffordable && balance > 0;

  const cities = useMemo(() => getCities(experiences), [experiences]);

  // Every experience in the city, best value first, plus the city average.
  const { rated, average } = useMemo(() => {
    const inCity = experiences.filter((exp) => exp.cities.includes(city));
    const avg = averageValuePer10k(inCity);
    const list: Rated[] = inCity
      .map((exp) => {
        const value = valuePer10k(exp);
        return { exp, value, tiers: getTiers(exp), label: getValueLabel(value, avg) };
      })
      .sort((a, b) => b.value - a.value);
    return { rated: list, average: avg };
  }, [experiences, city]);

  // "Only show what I can get right now" hides anything above the balance.
  const pool = useMemo(
    () => (filtering ? rated.filter((r) => r.tiers[0].points <= balance) : rated),
    [rated, filtering, balance]
  );

  const categories = useMemo(() => getCategories(rated.map((r) => r.exp)), [rated]);

  // If the chosen category doesn't exist in the newly chosen city, show "All".
  const activeCategory = selectedCategory && categories.includes(selectedCategory) ? selectedCategory : null;

  const sections = useMemo(
    () =>
      categories
        .filter((c) => !activeCategory || c === activeCategory)
        .map((category) => ({ category, items: pool.filter((r) => r.exp.category === category) }))
        .filter((s) => s.items.length > 0),
    [categories, activeCategory, pool]
  );

  const lineFor = (r: Rated, onBoard: boolean): Line => {
    if (!balance) {
      if (!onBoard) return { text: `From ${formatPoints(r.tiers[0].points)} points`, tone: 'muted' };
      const diff = Math.round((r.value / average - 1) * 100);
      if (diff > 0) return { text: `Worth ${diff}% more than average`, tone: 'good' };
      if (diff < 0) return { text: `Worth ${-diff}% less than average`, tone: 'note' };
      return { text: 'About average value', tone: 'muted' };
    }
    const tier = getBestAffordableTier(r.tiers, balance);
    if (tier) return { text: `You can get ${formatPounds(tier.pounds)} now (${formatPoints(tier.points)} pts)`, tone: 'good' };
    const first = r.tiers[0];
    return { text: `${formatPoints(first.points - balance)} more points to unlock ${formatPounds(first.pounds)}`, tone: 'note' };
  };

  const toggleExpanded = (category: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });

  const board = pool.slice(0, BOARD_SIZE);
  const cheapest = rated.reduce<Rated | null>((m, r) => (!m || r.tiers[0].points < m.tiers[0].points ? r : m), null);

  const choiceClass = (selected: boolean) =>
    `rounded-full border-[1.5px] text-sm font-bold cursor-pointer ${
      selected ? 'bg-navy text-white border-navy' : 'bg-white text-navy border-line hover:border-orange'
    }`;

  return (
    <main className="min-h-screen bg-cream">
      {/* ── Peach band: header, hero and leaderboard ─────────────────────── */}
      <div className="bg-peach">
        <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-1 lg:px-16 lg:py-[22px]">
          <div className="font-serif text-[21px] font-bold leading-[1.1] lg:text-[28px]">
            Yonder Points<br className="sm:hidden" /> Optimiser
          </div>
          <div className="flex items-center gap-2 lg:gap-6">
            <Link href="/faq" className="px-1 py-2.5 text-sm font-semibold text-navy no-underline hover:text-black lg:text-[15px]">
              FAQ
            </Link>
            <SettingsMenu
              settings={settings}
              cities={cities}
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              onSave={handleSave}
            />
          </div>
        </header>

        <div className="lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-16 lg:px-16 lg:pt-10 lg:pb-[72px]">
          {/* Hero: headline and the points balance sentence */}
          <section className="flex flex-col px-5 pt-4 pb-6 lg:p-0">
            <h1 className="m-0 font-serif text-4xl font-bold leading-none lg:text-[76px] lg:leading-[0.98]">
              Find the best-value redemptions for your points
            </h1>
            <div className="mt-5 max-w-[600px] lg:mt-auto lg:pt-9">
              <p className="m-0 text-[26px] font-extrabold leading-[1.35] tracking-[-0.01em] lg:text-[40px]">
                <label htmlFor="balance">What can I do with my</label>
                <input
                  id="balance"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="23,410"
                  aria-label={`Your points balance (what can I do with my points this ${monthName}?)`}
                  value={rawBalance ? formatPoints(balance) : ''}
                  onChange={(e) => setRawBalance(e.target.value)}
                  className="mx-1 inline-block w-[5.2em] rounded-none border-0 border-b-[3px] border-orange bg-transparent px-1.5 pb-0.5 text-center font-extrabold text-navy outline-none placeholder:text-navy/35 lg:w-[5.6em]"
                  style={{ font: 'inherit' }}
                />
                <label htmlFor="balance">points this {monthName}?</label>
              </p>
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-muted">Or pick</span>
                {QUICK_PICKS.map((v, i) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={v === balance}
                    onClick={() => setRawBalance(String(v))}
                    className={`min-h-11 px-3.5 ${choiceClass(v === balance)} ${i === 0 ? 'hidden lg:inline-block' : ''}`}
                  >
                    {formatPoints(v)}
                  </button>
                ))}
              </div>
              <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] font-semibold lg:mt-3.5">
                <input
                  type="checkbox"
                  checked={onlyAffordable}
                  onChange={() => setOnlyAffordable((v) => !v)}
                  className="m-0 h-5 w-5 accent-navy"
                />
                Only show what I can get right now
              </label>
            </div>
          </section>

          {/* Leaderboard: top 5 in the city */}
          <section className="flex px-4 pb-9 lg:p-0" aria-labelledby="board-title">
            <div className="flex flex-1 flex-col rounded-3xl border border-navy/[0.07] bg-[linear-gradient(180deg,#ffffff_0%,#f1f6fc_45%,#d9e6f4_100%)] p-5 shadow-[0_28px_56px_-28px_rgba(30,41,59,0.35)] lg:rounded-[32px] lg:p-8">
              <h2 id="board-title" className="m-0 text-xl font-extrabold lg:text-2xl">
                {filtering ? `Best you can get with ${formatPoints(balance)} points` : 'Where your points go furthest'}
              </h2>
              <p className="mt-1 mb-2.5 text-[13px] text-muted lg:mb-[18px] lg:text-sm">
                <span className="lg:hidden">
                  {filtering ? 'Within your balance, best value first' : `Per 10,000 points in ${city}, ${shortMonth}`}
                </span>
                <span className="hidden lg:inline">
                  {filtering
                    ? 'Ranked by value, only experiences within your balance'
                    : `Value per 10,000 points in ${city} this month (${monthLabel})`}
                </span>
              </p>
              <div className="hidden justify-between pb-2 text-xs font-bold text-muted lg:flex" aria-hidden="true">
                <span>Rank</span>
                <span>Per 10,000 points</span>
              </div>
              <ol className="m-0 flex list-none flex-col p-0 lg:flex-1 lg:justify-between">
                {board.length === 0 && (
                  <li className="border-t border-navy/[0.08] py-[18px] text-[15px] leading-normal">
                    {filtering && cheapest
                      ? `Nothing in ${city} fits ${formatPoints(balance)} points yet. The cheapest option is ${cheapest.exp.name} at ${formatPoints(cheapest.tiers[0].points)} points.`
                      : `No experiences in ${city} this month yet.`}
                  </li>
                )}
                {board.map((r, i) => {
                  const line = lineFor(r, true);
                  return (
                    <li key={r.exp.id} className="flex items-center gap-2.5 border-t border-navy/[0.08] py-[11px] lg:gap-4 lg:py-3.5">
                      <div
                        className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-base font-extrabold lg:h-10 lg:w-10 lg:text-lg ${
                          i < 3 ? `medal-${i + 1}` : 'bg-navy/[0.08]'
                        }`}
                      >
                        <span className="sr-only">Rank </span>
                        {i + 1}
                      </div>
                      <div aria-hidden="true" className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-peach text-[21px] lg:flex">
                        {getCategoryIcon(r.exp.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-bold lg:text-lg">{r.exp.name}</div>
                        <div className={`text-xs font-semibold lg:text-[13px] ${toneClass[line.tone]}`}>{line.text}</div>
                      </div>
                      <div className="text-xl font-extrabold lg:text-[26px]">{money(r.value)}</div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        </div>
      </div>

      {/* ── All experiences, by category ─────────────────────────────────── */}
      <section className="px-4 lg:px-16" aria-labelledby="all-title">
        <h2 id="all-title" className="m-0 mb-1 pt-1 text-[21px] font-extrabold lg:text-[28px]">
          All experiences in {city}
        </h2>
        <p className="m-0 text-sm leading-normal text-muted">
          Each category is sorted from best to worst value. Prices show what 10,000 points are worth.
        </p>

        {/* Category filter: dropdown on phones, pill bar on desktop */}
        <div className="mt-3.5 mb-5 lg:hidden">
          <label htmlFor="category" className="mb-1.5 block text-[13px] font-bold text-muted">
            Category
          </label>
          <div className="relative">
            <select
              id="category"
              value={activeCategory ?? ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="min-h-[52px] w-full appearance-none rounded-2xl border-[1.5px] border-navy bg-white pr-11 pl-[18px] text-base font-bold text-navy"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
        <div className="mt-5 mb-7 hidden w-fit flex-wrap items-center gap-3.5 rounded-full border border-line bg-white/55 px-4 py-3 lg:flex" role="group" aria-label="Category">
          <span className="pl-1.5 text-sm font-bold text-muted">Category</span>
          {[null, ...categories].map((c) => (
            <button
              key={c ?? 'all'}
              type="button"
              aria-pressed={activeCategory === c}
              onClick={() => setSelectedCategory(c)}
              className={`min-h-[42px] px-[18px] ${choiceClass(activeCategory === c)}`}
            >
              {c ?? 'All'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 lg:gap-6">
          {sections.map(({ category, items }) => {
            const single = activeCategory !== null;
            const open = single || expanded.has(category);
            const moreDesktop = !single && items.length > VISIBLE_DESKTOP;
            const moreMobile = !single && items.length > VISIBLE_MOBILE;
            const shown = open ? items : items.slice(0, VISIBLE_DESKTOP);

            return (
              <article
                key={category}
                className="rounded-[22px] border border-card-line bg-white px-4 pt-[18px] pb-2.5 shadow-[0_18px_40px_-30px_rgba(180,83,26,0.5)] lg:rounded-[28px] lg:px-7 lg:pt-[26px] lg:pb-[18px]"
              >
                <div className="mb-2 flex items-center gap-2.5 lg:mb-4">
                  <span aria-hidden="true" className="text-[19px] lg:text-[22px]">{getCategoryIcon(category)}</span>
                  <h3 className="m-0 text-lg font-extrabold lg:text-[22px]">{category}</h3>
                  <span className="text-sm font-bold text-muted">{items.length}</span>
                  <span className={`ml-auto -rotate-2 whitespace-nowrap text-lg ${handFont ? 'font-hand' : 'italic'} font-semibold text-note lg:text-[21px]`}>
                    {city} average {money(average)}
                  </span>
                </div>
                <ul className="m-0 list-none p-0 lg:grid lg:grid-cols-5 lg:gap-3">
                  {shown.map((r, i) => {
                    const line = lineFor(r, false);
                    // Collapsed phones show fewer than desktop: hide the extras there.
                    const hideOnMobile = !open && i >= VISIBLE_MOBILE;
                    return (
                      <ExperienceCard
                        key={r.exp.id}
                        className={hideOnMobile ? 'max-lg:hidden' : ''}
                        name={r.exp.name}
                        value={money(r.value)}
                        line={line.text}
                        lineTone={line.tone}
                        label={r.label}
                      />
                    );
                  })}
                </ul>
                {(moreMobile || moreDesktop) && (
                  <div className={`border-t border-line pt-1.5 lg:border-0 lg:pt-3 ${moreDesktop ? '' : 'lg:hidden'} ${moreMobile ? '' : 'hidden lg:block'}`}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => toggleExpanded(category)}
                      className="min-h-11 cursor-pointer border-0 bg-transparent px-1 text-sm font-bold text-navy underline underline-offset-[3px]"
                    >
                      {open ? (
                        'Show fewer'
                      ) : (
                        <>
                          <span className="lg:hidden">Show {items.length - VISIBLE_MOBILE} more</span>
                          <span className="hidden lg:inline">Show {items.length - VISIBLE_DESKTOP} more</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {sections.length === 0 && !filtering && (
          <p className="py-16 text-center text-lg text-muted">No experiences in {city} this month yet. Check back soon.</p>
        )}

        <footer className="mt-16 border-t border-line pt-8 pb-6">
          <p className="mx-auto max-w-4xl text-center text-sm leading-relaxed text-muted">
            Made with ❤️ for the Yonder community.
            <br />
            <br />
            This is an unofficial, third-party tool not affiliated with or endorsed by Yonder Technology Ltd. All Yonder
            trademarks and service marks belong to Yonder Technology Ltd. This tool is provided for informational
            purposes only.
          </p>
        </footer>
      </section>
    </main>
  );
}
