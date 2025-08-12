import { CardType, Experience } from './airtable';

export interface UserSettings {
  cardType: CardType;
  city: string;
  hasCompletedSetup: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  cardType: 'credit_paid',
  city: 'London',
  hasCompletedSetup: false
};

const SETTINGS_KEY = 'yonder-settings';

export function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export function getCities(experiences: Experience[]): string[] {
  const cities = Array.from(new Set(experiences.flatMap(exp => exp.city))).sort();
  
  // Put London first if it exists
  const londonIndex = cities.indexOf('London');
  if (londonIndex > 0) {
    cities.splice(londonIndex, 1);
    cities.unshift('London');
  }
  
  return cities;
}