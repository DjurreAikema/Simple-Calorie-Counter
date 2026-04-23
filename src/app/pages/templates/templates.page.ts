import {Component, inject} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {TemplateService} from '../../services/template.service';

@Component({
  selector: 'app-templates',
  imports: [DecimalPipe, RouterLink],
  template: `
    <section class="templates">
      <header>
        <a routerLink="/today" class="back">← Back</a>
        <h1>Templates</h1>
      </header>

      @if (templateService.all().length === 0) {
        <p class="empty">
          No templates yet. Tick “Save as template” when adding an entry to create one.
        </p>
      } @else {
        <ul class="list">
          @for (t of templateService.all(); track t.id) {
            <li>
              <div class="t-main">
                <span class="t-name">{{ t.displayName }}</span>
                <span class="t-macros">
                  {{ t.calories | number }} kcal
                  @if (t.protein != null) {
                    · P {{ t.protein }}g
                  }
                  @if (t.carbs != null) {
                    · C {{ t.carbs }}g
                  }
                  @if (t.fat != null) {
                    · F {{ t.fat }}g
                  }
                </span>
              </div>
              <div class="t-actions">
                <a [routerLink]="['/templates', t.id, 'edit']" class="btn">Edit</a>
                <button type="button" (click)="remove(t.id!)" class="btn danger">Delete</button>
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    .templates {
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

    .empty {
      color: #888;
      text-align: center;
      padding: 2rem 0;
    }

    .list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .list li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
    }

    .t-main {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .t-name {
      font-weight: 500;
    }

    .t-macros {
      font-size: 0.85rem;
      color: #666;
    }

    .t-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .btn {
      padding: 0.35rem 0.75rem;
      border-radius: 4px;
      font-size: 0.9rem;
      text-decoration: none;
      background: #eee;
      color: #333;
      border: none;
      cursor: pointer;
    }

    .btn.danger {
      background: #fee;
      color: #c00;
    }
  `],
})
export class TemplatesPage {
  protected readonly templateService = inject(TemplateService);

  remove(id: number): void {
    if (confirm('Delete this template? Historical entries will not be affected.')) {
      void this.templateService.remove(id);
    }
  }
}
