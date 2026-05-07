import {Component, computed, inject, signal} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {Entry} from '../../db';
import {EntryService, MacroTotals} from '../../services/entry.service';
import {GoalService} from '../../services/goal.service';
import {ProgressRingComponent} from '../../components/progress-ring.component';
import {parseDateKey} from '../../util/date.util';

@Component({
  selector: 'app-history-detail',
  imports: [DatePipe, DecimalPipe, RouterLink, ProgressRingComponent],
  template: `
    <section class="detail">
      <header>
        <a routerLink="/history" class="back">← Back</a>
        <h1>{{ date() | date: 'EEE, MMM d, y' }}</h1>
      </header>

      @if (loading()) {
        <p>Loading…</p>
      } @else if (notFound()) {
        <p class="error">Invalid date.</p>
      } @else {
        @if (goal() != null) {
          <div class="ring-wrap">
            <div class="ring">
              <app-progress-ring
                [consumed]="total()"
                [goal]="goal()!"
              />
              <div class="ring-center">
                <span class="consumed">{{ total() | number }}</span>
                <span class="unit">kcal</span>
                <span class="goal-label">of {{ goal() | number }}</span>
              </div>
            </div>
            <p class="remaining" [class.over]="remaining() < 0">
              @if (remaining() >= 0) {
                {{ remaining() | number }} kcal remaining
              } @else {
                {{ -remaining() | number }} kcal over
              }
            </p>
          </div>
        } @else {
          <div class="total-only">
            <span class="consumed">{{ total() | number }}</span>
            <span class="unit">kcal</span>
          </div>
        }

        @if (total() > 0) {
          <div class="macros">
            <div class="macro">
              <span class="m-label">Protein</span>
              <span class="m-value">{{ macros().protein | number: '1.0-0' }}g</span>
              <span class="m-pct">{{ macroPercents().protein | number: '1.0-0' }}%</span>
            </div>
            <div class="macro">
              <span class="m-label">Carbs</span>
              <span class="m-value">{{ macros().carbs | number: '1.0-0' }}g</span>
              <span class="m-pct">{{ macroPercents().carbs | number: '1.0-0' }}%</span>
            </div>
            <div class="macro">
              <span class="m-label">Fat</span>
              <span class="m-value">{{ macros().fat | number: '1.0-0' }}g</span>
              <span class="m-pct">{{ macroPercents().fat | number: '1.0-0' }}%</span>
            </div>
            <div class="macro">
              <span class="m-label">Fiber</span>
              <span class="m-value">{{ macros().fiber | number: '1.0-0' }}g</span>
              <span class="m-pct">&nbsp;</span>
            </div>
          </div>
        }

        @if (entries().length === 0) {
          <p class="empty">No entries on this day.</p>
        } @else {
          <ul class="entries">
            @for (entry of entries(); track entry.id) {
              <li>
                <div class="entry-main">
                  <span class="entry-name">{{ entry.name || 'Unnamed' }}</span>
                  <span class="entry-time">{{ entry.timestamp | date: 'HH:mm' }}</span>
                </div>
                <span class="entry-cal">{{ entry.calories }} kcal</span>
              </li>
            }
          </ul>
        }
      }
    </section>
  `,
  styles: [`
    .detail {
      padding: 1rem;
      max-width: 480px;
      margin: 0 auto;
    }

    header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    h1 {
      margin: 0;
      font-size: 1.25rem;
    }

    .back {
      color: #0a7;
      text-decoration: none;
    }

    .error {
      color: #c00;
    }

    /* Progress ring */

    .ring-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 1.5rem 0 1rem;
    }

    .ring {
      position: relative;
      width: 200px;
      height: 200px;
    }

    .ring-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .consumed {
      font-size: 2.25rem;
      font-weight: 600;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    .unit {
      font-size: 0.9rem;
      color: #666;
      margin-top: 0.1rem;
    }

    .goal-label {
      font-size: 0.85rem;
      color: #888;
      margin-top: 0.4rem;
      font-variant-numeric: tabular-nums;
    }

    .remaining {
      margin: 0.75rem 0 0;
      font-size: 0.95rem;
      color: #555;
      font-variant-numeric: tabular-nums;
    }

    .remaining.over {
      color: #d64545;
      font-weight: 500;
    }

    .total-only {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem 0;
    }

    /* Macros */

    .macros {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      padding: 0.75rem;
      border: 1px solid #eee;
      border-radius: 8px;
      margin: 0 0 1rem;
    }

    .macro {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
    }

    .m-label {
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .m-value {
      font-size: 1rem;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }

    .m-pct {
      font-size: 0.75rem;
      color: #888;
      font-variant-numeric: tabular-nums;
    }

    /* Entry list */

    .empty {
      color: #888;
      text-align: center;
      padding: 2rem 0;
    }

    .entries {
      list-style: none;
      padding: 0;
      margin: 1rem 0 0;
    }

    .entries li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
    }

    .entry-main {
      display: flex;
      flex-direction: column;
    }

    .entry-name {
      font-weight: 500;
    }

    .entry-time {
      font-size: 0.85rem;
      color: #666;
    }

    .entry-cal {
      font-variant-numeric: tabular-nums;
    }
  `],
})
export class HistoryDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly entryService = inject(EntryService);
  private readonly goalService = inject(GoalService);

  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly date = signal<Date>(new Date());
  protected readonly entries = signal<Entry[]>([]);
  protected readonly goal = signal<number | null>(null);

  protected readonly total = computed(() =>
    this.entries().reduce((sum, e) => sum + e.calories, 0),
  );

  protected readonly macros = computed<MacroTotals>(() =>
    this.entries().reduce<MacroTotals>(
      (acc, e) => ({
        protein: acc.protein + (e.protein ?? 0),
        carbs: acc.carbs + (e.carbs ?? 0),
        fat: acc.fat + (e.fat ?? 0),
        fiber: acc.fiber + (e.fiber ?? 0),
      }),
      {protein: 0, carbs: 0, fat: 0, fiber: 0},
    ),
  );

  protected readonly remaining = computed(() => {
    const g = this.goal();
    if (g == null) return 0;
    return g - this.total();
  });

  protected readonly macroPercents = computed(() => {
    const t = this.total();
    const {protein, carbs, fat} = this.macros();
    if (t <= 0) return {protein: 0, carbs: 0, fat: 0};
    return {
      protein: (protein * 4) / t * 100,
      carbs: (carbs * 4) / t * 100,
      fat: (fat * 9) / t * 100,
    };
  });

  constructor() {
    const dateKey = this.route.snapshot.paramMap.get('date');
    if (!dateKey) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    const parsed = parseDateKey(dateKey);
    if (!parsed) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.date.set(parsed);
    void this.load(parsed);
  }

  private async load(date: Date): Promise<void> {
    try {
      const [entries, goal] = await Promise.all([
        this.entryService.getEntriesByDate(date),
        this.goalService.goalForDate(date),
      ]);
      this.entries.set(entries);
      this.goal.set(goal);
    } finally {
      this.loading.set(false);
    }
  }
}
