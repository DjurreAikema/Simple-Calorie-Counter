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
    <section class="page detail">
      <header class="page-header">
        <a routerLink="/history">← Back</a>
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
