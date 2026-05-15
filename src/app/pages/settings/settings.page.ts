import {Component, effect, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {GoalService} from '../../services/goal.service';
import {NotificationService} from '../../services/notification.service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page settings">
      <header class="page-header">
        <a routerLink="/today">← Back</a>
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

      @if (notificationService.available()) {
        <div class="notification-section">
          <h2>Notifications</h2>
          <p class="fine-print">
            Your browser doesn't support icon badges. Enable a persistent
            notification to see today's calories at a glance.
          </p>
          @if (notificationService.enabled()) {
            <button type="button" class="btn-secondary" (click)="disableNotifications()">
              Disable notification
            </button>
          } @else {
            <button type="button" class="btn-primary" (click)="enableNotifications()">
              Enable notification
            </button>
            @if (notifDenied()) {
              <p class="error">
                Notification permission was denied. You can change this in your browser settings.
              </p>
            }
          }
        </div>
      }
    </section>
  `,
})
export class SettingsPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly goalService = inject(GoalService);

  protected readonly notificationService = inject(NotificationService);
  protected readonly notifDenied = signal(false);

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

  async enableNotifications(): Promise<void> {
    const ok = await this.notificationService.enable();
    this.notifDenied.set(!ok);
  }

  async disableNotifications(): Promise<void> {
    await this.notificationService.disable();
  }
}
