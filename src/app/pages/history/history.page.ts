import {Component, computed, inject} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {EntryService, DaySummary} from '../../services/entry.service';
import {GoalService} from '../../services/goal.service';

interface DaySummaryWithGoal extends DaySummary {
  goal: number | null;
}

@Component({
  selector: 'app-history',
  imports: [DatePipe, DecimalPipe, RouterLink],
  template: `
    <section class="page history">
      <header>
        <h1>History</h1>
        <nav class="header-right">
          <a routerLink="/templates" class="nav-link">Templates</a>
          <a routerLink="/settings" class="nav-link">Settings</a>
        </nav>
      </header>

      @if (enrichedDays().length === 0) {
        <p class="empty">No past entries yet. Start logging on the Today tab!</p>
      } @else {
        <ul class="days">
          @for (day of enrichedDays(); track day.dateKey) {
            <li>
              <a [routerLink]="['/history', day.dateKey]" class="day-link">
                <div class="day-info">
                  <span class="day-date">{{ day.date | date: 'EEE, MMM d, y' }}</span>
                  <span class="day-count">
                    {{ day.entryCount }} {{ day.entryCount === 1 ? 'entry' : 'entries' }}
                  </span>
                </div>
                <div class="day-total">
                  <span class="day-cal">{{ day.total | number }} kcal</span>
                  @if (day.goal != null) {
                    <span class="day-goal" [class.over]="day.total > day.goal">
                      {{ day.total * 100 / day.goal | number: '1.0-0' }}% of {{ day.goal | number }}
                    </span>
                  }
                </div>
              </a>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class HistoryPage {
  protected readonly entryService = inject(EntryService);
  protected readonly goalService = inject(GoalService);

  protected readonly enrichedDays = computed<DaySummaryWithGoal[]>(() => {
    const days = this.entryService.historyDays();
    const goals = this.goalService.allGoals();
    return days.map((day) => ({
      ...day,
      goal: this.goalService.goalForDateSync(day.date, goals),
    }));
  });
}
