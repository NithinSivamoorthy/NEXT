import type { CompletionMemory } from './memories';
import type { NextRecord } from './next';

export type CompletedNext = NextRecord & CompletionMemory;
export type MomentumDay = { key: string; count: number; before: boolean };
export type Momentum = { total: number; current: number; longest: number; lastDay: string | null; days: MomentumDay[] };

/**
 * Local calendar day, never UTC: a completion belongs to the day the user actually lived it.
 * Returns null for a timestamp that cannot be read, so a corrupt record is skipped rather
 * than silently counted on the epoch.
 */
export function dayKey(value: string | number | Date): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
}
/** Day arithmetic through the local Date constructor, so it stays correct across DST. */
export function shiftKey(key: string, delta: number): string {
  const [year, month, day] = key.split('-').map(Number);
  return dayKey(new Date(year, month - 1, day + delta))!;
}

/**
 * The streak rule, in full:
 *
 * - A completed NEXT counts on the local calendar day of its stored `completedAt`.
 * - Several completions on one day advance the streak once; they still count toward the total.
 * - The current streak is the run of consecutive days ending today. A run ending yesterday is
 *   still alive, because today is not over; anything older is broken and reads zero.
 * - The longest streak is the longest run anywhere in the record, including the current one.
 * - Nothing is inferred. With no completions every figure is zero, and days before the first
 *   completion are marked `before` rather than counted as missed.
 *
 * Everything is derived from the persisted history on each call. No counter is stored, so
 * none can drift, and an existing device needs no migration.
 */
export function deriveMomentum(history: readonly CompletedNext[], now: Date = new Date(), window = 14): Momentum {
  const counts = new Map<string, number>();
  for (const record of history) {
    if (record.status !== 'completed' || !record.completedAt) continue;
    const key = dayKey(record.completedAt);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  const keys = [...counts.keys()].sort();
  let longest = 0, run = 0, previous: string | null = null;
  for (const key of keys) {
    run = previous !== null && key === shiftKey(previous, 1) ? run + 1 : 1;
    if (run > longest) longest = run;
    previous = key;
  }
  const today = dayKey(now);
  let current = 0;
  if (today) {
    const yesterday = shiftKey(today, -1);
    let cursor: string | null = counts.has(today) ? today : counts.has(yesterday) ? yesterday : null;
    while (cursor && counts.has(cursor)) { current++; cursor = shiftKey(cursor, -1); }
  }
  const first = keys[0] ?? null;
  const days = today ? Array.from({ length: window }, (_, index) => {
    const key = shiftKey(today, index - (window - 1));
    return { key, count: counts.get(key) ?? 0, before: first === null || key < first };
  }) : [];
  return { total, current, longest, lastDay: keys.at(-1) ?? null, days };
}

/**
 * Saturating response: 0 with no streak, rising steeply at first and approaching but never
 * reaching 1. The star stays readable at any streak length instead of blowing out.
 */
export const momentumLevel = (streak: number) => 1 - Math.exp(-Math.max(0, streak) / 3.2);

/** Memory is the photographic archive: completed NEXTs that actually carry a photo. */
export const photoMemories = (history: readonly CompletedNext[]) =>
  history.filter(record => record.status === 'completed' && !!record.photoUri);

export function formatCompleted(value?: string) {
  const date = value ? new Date(value) : null;
  if (!date || !Number.isFinite(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}
