import {Injectable, effect, inject, signal} from '@angular/core';
import {db} from '../db';
import {BadgeService} from './badge.service';
import {EntryService} from './entry.service';
import {GoalService} from './goal.service';

interface NotificationOptionsWithActions extends NotificationOptions {
  actions?: { action: string; title: string; icon?: string }[];
  silent?: boolean;
}

@Injectable({providedIn: 'root'})
export class NotificationService {
  private readonly badgeService = inject(BadgeService);
  private readonly entryService = inject(EntryService);
  private readonly goalService = inject(GoalService);

  private static readonly TAG = 'calorie-today';

  readonly available = signal(false);

  readonly enabled = signal(false);

  constructor() {
    const canNotify =
      !this.badgeService.supported() &&
      'Notification' in window &&
      'serviceWorker' in navigator;

    this.available.set(canNotify);

    // Restore persisted preference (async, fires once).
    void this.loadSettings();

    // Reactively push the notification whenever total or goal changes.
    effect(() => {
      if (!this.enabled()) return;
      const total = this.entryService.todayTotal();
      const goal = this.goalService.currentGoal();
      void this.show(total, goal);
    });
  }

  async enable(): Promise<boolean> {
    if (!this.available()) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    this.enabled.set(true);
    await this.saveEnabled(true);

    // Trigger an immediate update.
    const total = this.entryService.todayTotal();
    const goal = this.goalService.currentGoal();
    await this.show(total, goal);
    return true;
  }

  async disable(): Promise<void> {
    this.enabled.set(false);
    await this.saveEnabled(false);
    await this.dismiss();
  }

  // private

  private async show(total: number, goal: number | null): Promise<void> {
    const reg = await navigator.serviceWorker?.ready;
    if (!reg) return;

    const body =
      goal != null
        ? `Today: ${total.toLocaleString()} / ${goal.toLocaleString()} kcal`
        : `Today: ${total.toLocaleString()} kcal`;

    try {
      await reg.showNotification('Simple Calorie Tracker', {
        body,
        tag: NotificationService.TAG,
        silent: true,
        actions: [{action: 'add', title: 'Add entry'}],
        icon: '/icons/icon-192x192.png',
      } as NotificationOptionsWithActions);
    } catch (e) {
      console.warn('Notification update failed', e);
    }
  }

  private async dismiss(): Promise<void> {
    try {
      const reg = await navigator.serviceWorker?.ready;
      const active = await reg?.getNotifications({tag: NotificationService.TAG});
      active?.forEach((n) => n.close());
    } catch {
      // Swallow — SW may not be ready in dev mode.
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const row = await db.settings.get('current');
      if (row?.notificationEnabled && Notification.permission === 'granted') {
        this.enabled.set(true);
      }
    } catch {
      // First run, table is empty — nothing to restore.
    }
  }

  private async saveEnabled(on: boolean): Promise<void> {
    const existing = await db.settings.get('current');
    if (existing) {
      await db.settings.update('current', {notificationEnabled: on});
    } else {
      await db.settings.put({
        key: 'current',
        weekStartsOn: 'monday',
        badgeEnabled: false,
        notificationEnabled: on,
      });
    }
  }
}
