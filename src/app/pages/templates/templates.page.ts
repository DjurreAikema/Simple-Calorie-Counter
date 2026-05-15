import {Component, inject} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {TemplateService} from '../../services/template.service';

@Component({
  selector: 'app-templates',
  imports: [DecimalPipe, RouterLink],
  template: `
    <section class="page templates">
      <header class="page-header">
        <a routerLink="/today">← Back</a>
        <h1>Templates</h1>
      </header>

      @if (templateService.all().length === 0) {
        <p class="empty">
          No templates yet. Tick "Save as template" when adding an entry to create one.
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
})
export class TemplatesPage {
  protected readonly templateService = inject(TemplateService);

  remove(id: number): void {
    if (confirm('Delete this template? Historical entries will not be affected.')) {
      void this.templateService.remove(id);
    }
  }
}
