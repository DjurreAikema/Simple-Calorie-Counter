import {Injectable} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {liveQuery} from 'dexie';
import {from} from 'rxjs';
import {db, Template} from '../db';

export type TemplateInput = Omit<Template, 'id' | 'name' | 'createdAt' | 'updatedAt'>;

@Injectable({providedIn: 'root'})
export class TemplateService {
  private readonly all$ = from(
    liveQuery(() => db.templates.orderBy('displayName').toArray()),
  );

  readonly all = toSignal(this.all$, {initialValue: [] as Template[]});

  async search(prefix: string): Promise<Template[]> {
    const q = prefix.trim().toLowerCase();
    if (!q) return [];
    return db.templates
      .where('name')
      .startsWithIgnoreCase(q)
      .limit(8)
      .toArray();
  }

  async get(id: number): Promise<Template | undefined> {
    return db.templates.get(id);
  }

  async upsertByName(input: TemplateInput): Promise<void> {
    const now = new Date();
    const name = input.displayName.trim().toLowerCase();
    const existing = await db.templates.where('name').equals(name).first();
    if (existing) {
      await db.templates.update(existing.id!, {...input, name, updatedAt: now});
    } else {
      await db.templates.add({...input, name, createdAt: now, updatedAt: now});
    }
  }

  async update(id: number, input: TemplateInput): Promise<void> {
    const name = input.displayName.trim().toLowerCase();
    await db.templates.update(id, {...input, name, updatedAt: new Date()});
  }

  async remove(id: number): Promise<void> {
    await db.templates.delete(id);
  }
}
