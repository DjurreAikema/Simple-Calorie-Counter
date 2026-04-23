import {Component, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {TemplateService} from '../../services/template.service';

@Component({
  selector: 'app-template-edit',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="edit">
      <header>
        <a routerLink="/templates" class="back">← Back</a>
        <h1>Edit template</h1>
      </header>

      @if (loading()) {
        <p>Loading…</p>
      } @else if (notFound()) {
        <p class="error">Template not found.</p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()">
          <label>
            <span>Name *</span>
            <input type="text" formControlName="displayName"/>
          </label>

          <label>
            <span>Calories *</span>
            <input type="number" inputmode="numeric" formControlName="calories" min="1" step="1"/>
          </label>

          <fieldset>
            <legend>Macros (grams, optional)</legend>
            <label>
              <span>Protein</span>
              <input type="number" inputmode="decimal" formControlName="protein" min="0" step="0.1"/>
            </label>
            <label>
              <span>Carbs</span>
              <input type="number" inputmode="decimal" formControlName="carbs" min="0" step="0.1"/>
            </label>
            <label>
              <span>Fat</span>
              <input type="number" inputmode="decimal" formControlName="fat" min="0" step="0.1"/>
            </label>
            <label>
              <span>Fiber</span>
              <input type="number" inputmode="decimal" formControlName="fiber" min="0" step="0.1"/>
            </label>
          </fieldset>

          @if (saveError()) {
            <p class="error">{{ saveError() }}</p>
          }

          <div class="actions">
            <a routerLink="/templates" class="btn-secondary">Cancel</a>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
      }
    </section>
  `,
  styles: [`
    .edit {
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
export class TemplateEditPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly templateService = inject(TemplateService);

  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  private templateId: number | null = null;

  protected readonly form = this.fb.group({
    displayName: this.fb.control<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(1)],
    }),
    calories: this.fb.control<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    protein: this.fb.control<number | null>(null, {validators: [Validators.min(0)]}),
    carbs: this.fb.control<number | null>(null, {validators: [Validators.min(0)]}),
    fat: this.fb.control<number | null>(null, {validators: [Validators.min(0)]}),
    fiber: this.fb.control<number | null>(null, {validators: [Validators.min(0)]}),
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }
    this.templateId = id;
    void this.load(id);
  }

  private async load(id: number): Promise<void> {
    const t = await this.templateService.get(id);
    if (!t) {
      this.notFound.set(true);
    } else {
      this.form.patchValue({
        displayName: t.displayName,
        calories: t.calories,
        protein: t.protein ?? null,
        carbs: t.carbs ?? null,
        fat: t.fat ?? null,
        fiber: t.fiber ?? null,
      });
    }
    this.loading.set(false);
  }

  async save(): Promise<void> {
    if (this.form.invalid || this.saving() || this.templateId == null) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const v = this.form.getRawValue();
      await this.templateService.update(this.templateId, {
        displayName: v.displayName.trim(),
        calories: v.calories!,
        protein: v.protein ?? undefined,
        carbs: v.carbs ?? undefined,
        fat: v.fat ?? undefined,
        fiber: v.fiber ?? undefined,
      });
      await this.router.navigate(['/templates']);
    } catch (err) {
      // Most likely cause: renamed to collide with another template's unique name.
      this.saveError.set(
        'Could not save. A template with that name may already exist.',
      );
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }
}
