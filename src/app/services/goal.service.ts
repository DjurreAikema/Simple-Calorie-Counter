import {Injectable} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {liveQuery} from 'dexie';
import {from} from 'rxjs';
import {db, GoalHistory} from '../db';
import {startOfDay} from '../util/date.util';

@Injectable({providedIn: 'root'})
export class GoalService {
  private readonly currentGoal$ = from(
    liveQuery(async () => {
      const latest = await db.goalHistory
        .orderBy('effectiveFrom')
        .reverse()
        .first();
      return latest?.dailyGoal ?? null;
    }),
  );

  readonly currentGoal = toSignal(this.currentGoal$, {
    initialValue: null as number | null,
  });

  private readonly allGoals$ = from(
    liveQuery(() => db.goalHistory.orderBy('effectiveFrom').toArray()),
  );

  readonly allGoals = toSignal(this.allGoals$, {initialValue: [] as GoalHistory[]});

  async setDailyGoal(dailyGoal: number): Promise<void> {
    const effectiveFrom = startOfDay();
    const existing = await db.goalHistory
      .where('effectiveFrom')
      .equals(effectiveFrom)
      .first();
    if (existing) {
      await db.goalHistory.update(existing.id!, {dailyGoal});
    } else {
      await db.goalHistory.add({effectiveFrom, dailyGoal});
    }
  }

  async goalForDate(date: Date): Promise<number | null> {
    const dayStart = startOfDay(date);
    const row = await db.goalHistory
      .where('effectiveFrom')
      .belowOrEqual(dayStart)
      .reverse()
      .first();
    return row?.dailyGoal ?? null;
  }

  goalForDateSync(date: Date, goals: GoalHistory[]): number | null {
    const dayStart = startOfDay(date).getTime();
    let result: number | null = null;
    for (const g of goals) {
      if (g.effectiveFrom.getTime() <= dayStart) {
        result = g.dailyGoal;
      } else {
        break;
      }
    }
    return result;
  }
}
