import {Injectable, computed} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {liveQuery} from 'dexie';
import {from} from 'rxjs';
import {db, Entry} from '../db';
import {endOfDay, endOfWeek, formatDateKey, startOfDay, startOfWeek} from '../util/date.util';

export type NewEntryInput = Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>;

export interface MacroTotals {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface DaySummary {
  dateKey: string;   // 'YYYY-MM-DD'
  date: Date;        // local midnight
  total: number;     // total kcal
  entryCount: number;
}

@Injectable({providedIn: 'root'})
export class EntryService {
  // Today

  // TODO: if the app stays open past midnight, this range is stale.
  // Revisit once we add a "current day" signal driven by a timer.
  private readonly todayEntries$ = from(
    liveQuery(async () => {
      const entries = await db.entries
        .where('timestamp')
        .between(startOfDay(), endOfDay())
        .toArray();
      return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }),
  );

  readonly todayEntries = toSignal(this.todayEntries$, {initialValue: [] as Entry[]});

  readonly todayTotal = computed(() =>
    this.todayEntries().reduce((sum, e) => sum + e.calories, 0),
  );

  readonly todayMacros = computed<MacroTotals>(() =>
    this.todayEntries().reduce<MacroTotals>(
      (acc, e) => ({
        protein: acc.protein + (e.protein ?? 0),
        carbs: acc.carbs + (e.carbs ?? 0),
        fat: acc.fat + (e.fat ?? 0),
        fiber: acc.fiber + (e.fiber ?? 0),
      }),
      {protein: 0, carbs: 0, fat: 0, fiber: 0},
    ),
  );

  // Week

  // TODO: same staleness caveat as todayEntries — week boundary won't roll over
  // for a session that's open across Sunday→Monday.
  private readonly weekEntries$ = from(
    liveQuery(() =>
      db.entries
        .where('timestamp')
        .between(startOfWeek(), endOfWeek())
        .toArray(),
    ),
  );

  readonly weekEntries = toSignal(this.weekEntries$, {initialValue: [] as Entry[]});

  readonly weekDailyTotals = computed(() => {
    const totals: number[] = [0, 0, 0, 0, 0, 0, 0];
    for (const e of this.weekEntries()) {
      const day = e.timestamp.getDay(); // 0=Sun ... 6=Sat
      const idx = day === 0 ? 6 : day - 1;
      totals[idx] += e.calories;
    }
    return totals;
  });

  readonly weekTotal = computed(() =>
    this.weekEntries().reduce((sum, e) => sum + e.calories, 0),
  );

  readonly weekMacros = computed<MacroTotals>(() =>
    this.weekEntries().reduce<MacroTotals>(
      (acc, e) => ({
        protein: acc.protein + (e.protein ?? 0),
        carbs: acc.carbs + (e.carbs ?? 0),
        fat: acc.fat + (e.fat ?? 0),
        fiber: acc.fiber + (e.fiber ?? 0),
      }),
      {protein: 0, carbs: 0, fat: 0, fiber: 0},
    ),
  );

  // History

  private readonly allEntries$ = from(
    liveQuery(() => db.entries.orderBy('timestamp').toArray()),
  );

  private readonly allEntries = toSignal(this.allEntries$, {initialValue: [] as Entry[]});

  readonly historyDays = computed<DaySummary[]>(() => {
    const todayKey = formatDateKey(new Date());
    const map = new Map<string, DaySummary>();

    for (const e of this.allEntries()) {
      const key = formatDateKey(e.timestamp);
      if (key === todayKey) continue;
      const existing = map.get(key);
      if (existing) {
        existing.total += e.calories;
        existing.entryCount++;
      } else {
        map.set(key, {
          dateKey: key,
          date: startOfDay(e.timestamp),
          total: e.calories,
          entryCount: 1,
        });
      }
    }

    return [...map.values()].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  });

  async getEntriesByDate(date: Date): Promise<Entry[]> {
    const entries = await db.entries
      .where('timestamp')
      .between(startOfDay(date), endOfDay(date))
      .toArray();
    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // CRUD

  async get(id: number): Promise<Entry | undefined> {
    return db.entries.get(id);
  }

  async add(input: NewEntryInput): Promise<number> {
    const now = new Date();
    return db.entries.add({...input, createdAt: now, updatedAt: now});
  }

  async update(id: number, input: NewEntryInput): Promise<void> {
    await db.entries.update(id, {...input, updatedAt: new Date()});
  }

  async remove(id: number): Promise<void> {
    await db.entries.delete(id);
  }
}
