import {Component, inject} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {EntryService} from '../../services/entry.service';
import {GoalService} from '../../services/goal.service';

@Component({
  selector: 'app-history',
  imports: [DatePipe, DecimalPipe, RouterLink],
  template: `
    <section class="history">
      <header>
        <h1>History</h1>
        <nav class="header-right">
          <a routerLink="/templates" class="nav-link">Templates</a>
          <a routerLink="/settings" class="nav-link">Settings</a>
        </nav>
      </header>

      @if (entryService.historyDays().length === 0) {
        <p class="empty">No past entries yet. Start logging on the Today tab!</p>
      } @else {
        <ul class="days">
          @for (day of entryService.historyDays(); track day.dateKey) {
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
                </div>
              </a>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    .history {
      padding: 1rem;
      max-width: 480px;
      margin: 0 auto;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 1rem;
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

    .empty {
      color: #888;
      text-align: center;
      padding: 2rem 0;
    }

    .days {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .days li + li {
      border-top: 1px solid #eee;
    }

    .day-link {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 0;
      text-decoration: none;
      color: inherit;
    }

    .day-info {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .day-date {
      font-weight: 500;
    }

    .day-count {
      font-size: 0.8rem;
      color: #888;
    }

    .day-total {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.15rem;
    }

    .day-cal {
      font-size: 1.05rem;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
  `],
})
export class HistoryPage {
  protected readonly entryService = inject(EntryService);
  protected readonly goalService = inject(GoalService);
}
