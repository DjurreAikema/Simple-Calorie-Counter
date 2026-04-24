import {Component, inject, signal} from '@angular/core';
import {AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators,} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {debounceTime, distinctUntilChanged, filter, from, switchMap} from 'rxjs';
import {EntryService} from '../../services/entry.service';
import {TemplateService} from '../../services/template.service';
import {Template} from '../../db';
import {fromDatetimeLocal, toDatetimeLocal} from '../../util/date.util';

function templateNameRequired(group: AbstractControl): ValidationErrors | null {
  const saveAsTemplate = group.get('saveAsTemplate')?.value;
  const name = (group.get('name')?.value as string | null)?.trim();
  return saveAsTemplate && !name ? {templateNameRequired: true} : null;
}

function notInFuture(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string | null;
  if (!v) return null;
  return fromDatetimeLocal(v).getTime() > Date.now() ? {futureTimestamp: true} : null;
}

@Component({
  selector: 'app-add',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="add">
      <header>
        <a routerLink="/today" class="back">← Back</a>
        <h1>{{ editingId() != null ? 'Edit entry' : 'Add entry' }}</h1>
      </header>

      @if (loadError()) {
        <p class="error">{{ loadError() }}</p>
      } @else if (loading()) {
        <p>Loading…</p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()">
          <label>
            <span>Calories *</span>
            <input type="number" inputmode="numeric" formControlName="calories" min="1" step="1"/>
          </label>

          <label class="name-field">
            <span>Name</span>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g. Breakfast"
              autocomplete="off"
              (focus)="onNameFocus()"
              (blur)="onNameBlur()"
              (keydown)="onNameKeydown($event)"
            />
            @if (showSuggestions() && suggestions().length > 0) {
              <ul class="suggestions" role="listbox">
                @for (t of suggestions(); track t.id; let i = $index) {
                  <li
                    role="option"
                    [class.highlighted]="i === highlightedIndex()"
                    (mousedown)="selectSuggestion(t); $event.preventDefault()"
                  >
                    <span class="s-name">{{ t.displayName }}</span>
                    <span class="s-cal">{{ t.calories }} kcal</span>
                  </li>
                }
              </ul>
            }
          </label>

          <label>
            <span>When</span>
            <input type="datetime-local" formControlName="timestamp" [max]="maxTimestamp"/>
            @if (form.controls.timestamp.errors?.['futureTimestamp'] && form.controls.timestamp.touched) {
              <small class="error">Timestamp can't be in the future.</small>
            }
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

          @if (editingId() == null) {
            <label class="checkbox">
              <input type="checkbox" formControlName="saveAsTemplate"/>
              <span>Save as template</span>
            </label>

            @if (form.errors?.['templateNameRequired'] && form.touched) {
              <p class="error">A name is required to save as a template.</p>
            }
          }

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
      }
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

    input[type='number'], input[type='text'], input[type='datetime-local'] {
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

    .name-field {
      position: relative;
    }

    .suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 10;
      list-style: none;
      margin: 4px 0 0;
      padding: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      max-height: 240px;
      overflow-y: auto;
    }

    .suggestions li {
      padding: 0.6rem 0.75rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .suggestions li:hover, .suggestions li.highlighted {
      background: #f0f7f4;
    }

    .s-name {
      font-weight: 500;
    }

    .s-cal {
      font-size: 0.85rem;
      color: #666;
      font-variant-numeric: tabular-nums;
    }

    .checkbox {
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
    }

    .checkbox span {
      font-size: 1rem;
      color: #333;
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
export class AddPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly entryService = inject(EntryService);
  private readonly templateService = inject(TemplateService);

  protected readonly editingId = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly suggestions = signal<Template[]>([]);
  protected readonly showSuggestions = signal(false);
  protected readonly highlightedIndex = signal(-1);

  protected readonly maxTimestamp = toDatetimeLocal(new Date());

  protected readonly form = this.fb.group(
    {
      calories: this.fb.control<number | null>(null, {
        validators: [Validators.required, Validators.min(1)],
      }),
      name: this.fb.control<string>('', {nonNullable: true}),
      timestamp: this.fb.control<string>(toDatetimeLocal(new Date()), {
        nonNullable: true,
        validators: [Validators.required, notInFuture],
      }),
      protein: this.fb.control<number | null>(null, {validators: [Validators.min(0)]}),
      carbs: this.fb.control<number | null>(null, {validators: [Validators.min(0)]}),
      fat: this.fb.control<number | null>(null, {validators: [Validators.min(0)]}),
      fiber: this.fb.control<number | null>(null, {validators: [Validators.min(0)]}),
      saveAsTemplate: this.fb.control<boolean>(false, {nonNullable: true}),
    },
    {validators: [templateNameRequired]},
  );

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam != null) {
      const id = Number(idParam);
      if (Number.isFinite(id)) {
        this.editingId.set(id);
        void this.loadEntry(id);
      } else {
        this.loadError.set('Invalid entry id.');
      }
    }

    this.form.controls.name.valueChanges
      .pipe(
        filter(() => this.editingId() == null),
        debounceTime(100),
        distinctUntilChanged(),
        switchMap((q) => from(this.templateService.search(q ?? ''))),
        takeUntilDestroyed(),
      )
      .subscribe((results) => {
        this.suggestions.set(results);
        this.highlightedIndex.set(-1);
      });
  }

  private async loadEntry(id: number): Promise<void> {
    this.loading.set(true);
    try {
      const entry = await this.entryService.get(id);
      if (!entry) {
        this.loadError.set('Entry not found.');
        return;
      }
      this.form.patchValue({
        calories: entry.calories,
        name: entry.name ?? '',
        timestamp: toDatetimeLocal(entry.timestamp),
        protein: entry.protein ?? null,
        carbs: entry.carbs ?? null,
        fat: entry.fat ?? null,
        fiber: entry.fiber ?? null,
      });
    } finally {
      this.loading.set(false);
    }
  }

  protected onNameFocus(): void {
    if (this.editingId() == null) this.showSuggestions.set(true);
  }

  protected onNameBlur(): void {
    setTimeout(() => this.showSuggestions.set(false), 120);
  }

  protected onNameKeydown(event: KeyboardEvent): void {
    const count = this.suggestions().length;
    if (!this.showSuggestions() || count === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightedIndex.update((i) => (i + 1) % count);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex.update((i) => (i <= 0 ? count - 1 : i - 1));
    } else if (event.key === 'Enter') {
      const i = this.highlightedIndex();
      if (i >= 0) {
        event.preventDefault();
        this.selectSuggestion(this.suggestions()[i]);
      }
    } else if (event.key === 'Escape') {
      this.showSuggestions.set(false);
    }
  }

  protected selectSuggestion(t: Template): void {
    this.form.patchValue({
      name: t.displayName,
      calories: t.calories,
      protein: t.protein ?? null,
      carbs: t.carbs ?? null,
      fat: t.fat ?? null,
      fiber: t.fiber ?? null,
    });
    this.showSuggestions.set(false);
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
      const name = v.name.trim() || undefined;
      const timestamp = fromDatetimeLocal(v.timestamp);

      const payload = {
        timestamp,
        calories: v.calories!,
        name,
        protein: v.protein ?? undefined,
        carbs: v.carbs ?? undefined,
        fat: v.fat ?? undefined,
        fiber: v.fiber ?? undefined,
      };

      const id = this.editingId();
      if (id != null) {
        await this.entryService.update(id, payload);
      } else {
        await this.entryService.add(payload);

        if (v.saveAsTemplate && name) {
          await this.templateService.upsertByName({
            displayName: name,
            calories: v.calories!,
            protein: v.protein ?? undefined,
            carbs: v.carbs ?? undefined,
            fat: v.fat ?? undefined,
            fiber: v.fiber ?? undefined,
          });
        }
      }

      await this.router.navigate(['/today']);
    } catch (err) {
      this.saveError.set('Could not save. Please try again.');
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }
}
