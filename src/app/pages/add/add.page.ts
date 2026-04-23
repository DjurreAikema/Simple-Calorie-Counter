import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EntryService } from '../../services/entry.service';

@Component({
  selector: 'app-add',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="add">
      <header>
        <a routerLink="/today" class="back">← Back</a>
        <h1>Add entry</h1>
      </header>

      <form [formGroup]="form" (ngSubmit)="save()">
        <label>
          <span>Calories *</span>
          <input type="number" inputmode="numeric" formControlName="calories" min="1" step="1" />
        </label>

        <label>
          <span>Name</span>
          <input type="text" formControlName="name" placeholder="e.g. Breakfast" />
        </label>

        <fieldset>
          <legend>Macros (grams, optional)</legend>
          <label>
            <span>Protein</span>
            <input type="number" inputmode="decimal" formControlName="protein" min="0" step="0.1" />
          </label>
          <label>
            <span>Carbs</span>
            <input type="number" inputmode="decimal" formControlName="carbs" min="0" step="0.1" />
          </label>
          <label>
            <span>Fat</span>
            <input type="number" inputmode="decimal" formControlName="fat" min="0" step="0.1" />
          </label>
          <label>
            <span>Fiber</span>
            <input type="number" inputmode="decimal" formControlName="fiber" min="0" step="0.1" />
          </label>
        </fieldset>

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
    .add {
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

    fieldset {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 0.75rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    legend {
      font-size: 0.85rem;
      color: #555;
      padding: 0 0.25rem;
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
export class AddPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly entryService = inject(EntryService);

  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    calories: this.fb.control<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    name: this.fb.control<string>('', { nonNullable: true }),
    protein: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    carbs: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    fat: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
    fiber: this.fb.control<number | null>(null, { validators: [Validators.min(0)] }),
  });

  async save(): Promise<void> {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    try {
      const v = this.form.getRawValue();
      await this.entryService.add({
        timestamp: new Date(),
        calories: v.calories!,
        name: v.name.trim() || undefined,
        protein: v.protein ?? undefined,
        carbs: v.carbs ?? undefined,
        fat: v.fat ?? undefined,
        fiber: v.fiber ?? undefined,
      });
      await this.router.navigate(['/today']);
    } finally {
      this.saving.set(false);
    }
  }
}
