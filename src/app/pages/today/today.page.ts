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
    <section class="page today">
      <header class="page-header-spread">
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
