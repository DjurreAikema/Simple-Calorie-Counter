import {Injectable, computed} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {liveQuery} from 'dexie';
import {from} from 'rxjs';
import {db, Entry} from '../db';
import {endOfDay, startOfDay} from '../util/date.util';

export type NewEntryInput = Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>;

export interface MacroTotals {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

@Injectable({providedIn: 'root'})
export class EntryService {
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

  async add(input: NewEntryInput): Promise<number> {
    const now = new Date();
    return db.entries.add({...input, createdAt: now, updatedAt: now});
  }

  async remove(id: number): Promise<void> {
    await db.entries.delete(id);
  }
}
