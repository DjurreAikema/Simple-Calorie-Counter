import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EntryService } from '../../services/entry.service';

@Component({
  selector: 'app-today',
  imports: [DatePipe, DecimalPipe, RouterLink],
  template: `
    <section class="today">
      <header>
        <h1>Today</h1>
        <div class="header-right">
          <a routerLink="/templates" class="nav-link">Templates</a>
          <p class="total">{{ entryService.todayTotal() | number }} kcal</p>
        </div>
      </header>

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
                <button type="button" (click)="remove(entry.id!)" aria-label="Delete">✕</button>
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

    .total {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
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

    .entry-actions button {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      color: #999;
      padding: 0.25rem 0.5rem;
    }

    .entry-actions button:hover {
      color: #c00;
    }

    .fab {
      position: fixed;
      bottom: 1.5rem;
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
  `],
})
export class TodayPage {
  protected readonly entryService = inject(EntryService);

  remove(id: number): void {
    if (confirm('Delete this entry?')) {
      void this.entryService.remove(id);
    }
  }
}
