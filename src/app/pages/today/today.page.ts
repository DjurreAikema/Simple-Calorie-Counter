import {Component, computed, inject} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {EntryService} from '../../services/entry.service';
import {GoalService} from '../../services/goal.service';
import {ProgressRingComponent} from '../../components/progress-ring.component';

@Component({
  selector: 'app-today',
  imports: [DatePipe, DecimalPipe, RouterLink, ProgressRingComponent],
  template: `
    <section class="today">
      <header>
        <h1>Today</h1>
        <nav class="header-right">
          <a routerLink="/templates" class="nav-link">Templates</a>
          <a routerLink="/settings" class="nav-link">Settings</a>
        </nav>
      </header>

      @if (goalService.currentGoal() != null) {
        <div class="ring-wrap">
          <div class="ring">
            <app-progress-ring
              [consumed]="entryService.todayTotal()"
              [goal]="goalService.currentGoal()!"
            />
            <div class="ring-center">
              <span class="consumed">{{ entryService.todayTotal() | number }}</span>
              <span class="unit">kcal</span>
              <span class="goal">of {{ goalService.currentGoal() | number }}</span>
            </div>
          </div>
          <p class="remaining" [class.over]="remaining()! < 0">
            @if (remaining()! >= 0) {
              {{ remaining() | number }} kcal remaining
            } @else {
              {{ -remaining()! | number }} kcal over
            }
          </p>
        </div>
      } @else {
        <div class="no-goal">
          <p>No daily goal set yet.</p>
          <a routerLink="/settings" class="btn-primary">Set goal</a>
        </div>
      }

      @if (entryService.todayTotal() > 0) {
        <div class="macros">
          <div class="macro">
            <span class="m-label">Protein</span>
            <span class="m-value">{{ entryService.todayMacros().protein | number: '1.0-0' }}g</span>
            <span class="m-pct">{{ macroPercents().protein * 100 | number: '1.0-0' }}%</span>
          </div>
          <div class="macro">
            <span class="m-label">Carbs</span>
            <span class="m-value">{{ entryService.todayMacros().carbs | number: '1.0-0' }}g</span>
            <span class="m-pct">{{ macroPercents().carbs * 100 | number: '1.0-0' }}%</span>
          </div>
          <div class="macro">
            <span class="m-label">Fat</span>
            <span class="m-value">{{ entryService.todayMacros().fat | number: '1.0-0' }}g</span>
            <span class="m-pct">{{ macroPercents().fat * 100 | number: '1.0-0' }}%</span>
          </div>
          <div class="macro">
            <span class="m-label">Fiber</span>
            <span class="m-value">{{ entryService.todayMacros().fiber | number: '1.0-0' }}g</span>
            <span class="m-pct">&nbsp;</span>
          </div>
        </div>
      }

      @if (entryService.todayEntries().length === 0) {
        <p class="empty">Nothing logged yet.</p>
      } @else {
        <ul class="entries">
          @for (entry of entryService.todayEntries(); track entry.id) {
            <li>
              <div class="entry-main">
                <span class="entry-name">{{ entry.name || 'Unnamed' }}</span>
                <span class="entry-time">{{ entry.timestamp | date: 'HH:mm' }}</span>
              </div>
              <div class="entry-actions">
                <span class="entry-cal">{{ entry.calories }} kcal</span>
                <a [routerLink]="['/entries', entry.id, 'edit']" aria-label="Edit" class="icon-btn edit">
                  ✎
                </a>
                <button type="button" (click)="remove(entry.id!)" aria-label="Delete" class="icon-btn delete">
                  ✕
                </button>
              </div>
            </li>
          }
        </ul>
      }

      <a routerLink="/add" class="fab" aria-label="Add entry">+</a>
    </section>
  `,
  styles: [`
    .today {
      padding: 1rem;
      max-width: 480px;
      margin: 0 auto;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .nav-link {
      font-size: 0.9rem;
      color: #0a7;
      text-decoration: none;
    }

    .ring-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 1.5rem 0 1rem;
    }

    .ring {
      position: relative;
      width: 220px;
      height: 220px;
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
      font-size: 2.5rem;
      font-weight: 600;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    .unit {
      font-size: 0.9rem;
      color: #666;
      margin-top: 0.1rem;
    }

    .goal {
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

    .no-goal {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2rem 0;
      color: #666;
    }

    .no-goal p {
      margin: 0;
    }

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

    .btn-primary {
      padding: 0.6rem 1.25rem;
      border-radius: 6px;
      font-size: 1rem;
      background: #0a7;
      color: white;
      text-decoration: none;
      border: none;
    }

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

    .entry-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .entry-cal {
      font-variant-numeric: tabular-nums;
    }

    .entry-actions .icon-btn {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      color: #999;
      padding: 0.25rem 0.5rem;
      text-decoration: none;
      line-height: 1;
    }

    .entry-actions .icon-btn.edit:hover {
      color: #0a7;
    }

    .entry-actions .icon-btn.delete:hover {
      color: #c00;
    }

    .fab {
      position: fixed;
      bottom: calc(56px + 1rem);
      right: 1.5rem;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #0a7;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      font-size: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  `],
})
export class TodayPage {
  protected readonly entryService = inject(EntryService);
  protected readonly goalService = inject(GoalService);

  protected readonly remaining = computed(() => {
    const g = this.goalService.currentGoal();
    if (g == null) return null;
    return g - this.entryService.todayTotal();
  });

  protected readonly macroPercents = computed(() => {
    const total = this.entryService.todayTotal();
    const {protein, carbs, fat} = this.entryService.todayMacros();
    if (total <= 0) return {protein: 0, carbs: 0, fat: 0};
    return {
      protein: (protein * 4) / total,
      carbs: (carbs * 4) / total,
      fat: (fat * 9) / total,
    };
  });

  remove(id: number): void {
    if (confirm('Delete this entry?')) {
      void this.entryService.remove(id);
    }
  }
}
