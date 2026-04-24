import {Component, effect, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {GoalService} from '../../services/goal.service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="settings">
      <header>
        <a routerLink="/today" class="back">← Back</a>
        <h1>Settings</h1>
      </header>

      <form [formGroup]="form" (ngSubmit)="save()">
        <label>
          <span>Daily calorie goal *</span>
          <input
            type="number"
            inputmode="numeric"
            formControlName="dailyGoal"
            min="1"
            step="1"
            placeholder="e.g. 2000"
          />
          @if (currentGoal() != null) {
            <small class="hint">Currently: {{ currentGoal() }} kcal / day</small>
          }
        </label>

        <p class="fine-print">
          New goal applies from today onward. Past days keep the goal that was active then.
        </p>

        @if (saveError()) {
          <p class="error">{{ saveError() }}</p>
        }

        <div class="actions">
          <a routerLink="/today" class="btn-secondary">Cancel</a>
          <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .settings {
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

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    label span {
      font-size: 0.85rem;
      color: #555;
    }

    input {
      padding: 0.6rem;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 6px;
    }

    input:focus {
      outline: 2px solid #0a7;
      border-color: transparent;
    }

    .hint {
      font-size: 0.8rem;
      color: #888;
      margin-top: 0.25rem;
    }

    .fine-print {
      font-size: 0.85rem;
      color: #666;
      margin: 0;
    }

    .error {
      color: #c00;
      margin: 0;
      font-size: 0.9rem;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    .btn-primary, .btn-secondary {
      padding: 0.6rem 1.25rem;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      text-decoration: none;
      border: none;
      display: inline-flex;
      align-items: center;
    }

    .btn-primary {
      background: #0a7;
      color: white;
    }

    .btn-primary:disabled {
      background: #aaa;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #eee;
      color: #333;
    }
  `],
})
export class SettingsPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly goalService = inject(GoalService);

  protected readonly currentGoal = this.goalService.currentGoal;
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    dailyGoal: this.fb.control<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  constructor() {
    effect(() => {
      const g = this.currentGoal();
      if (g != null && this.form.pristine) {
        this.form.controls.dailyGoal.setValue(g);
      }
    });
  }

  async save(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const v = this.form.getRawValue();
      await this.goalService.setDailyGoal(v.dailyGoal!);
      await this.router.navigate(['/today']);
    } catch (err) {
      this.saveError.set('Could not save. Please try again.');
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }
}
