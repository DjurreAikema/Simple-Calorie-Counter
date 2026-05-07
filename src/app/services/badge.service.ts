import {Injectable, effect, inject, signal} from '@angular/core';
import {EntryService} from './entry.service';

@Injectable({providedIn: 'root'})
export class BadgeService {
  private readonly entryService = inject(EntryService);

  readonly supported = signal(
    'setAppBadge' in navigator && typeof (navigator as NavigatorBadge).setAppBadge === 'function',
  );

  constructor() {
    // Reactively update the badge whenever today's total changes.
    effect(() => {
      const total = this.entryService.todayTotal();
      void this.update(total);
    });
  }

  private async update(total: number): Promise<void> {
    if (!this.supported()) return;
    const nav = navigator as NavigatorBadge;
    try {
      if (total > 0) {
        await nav.setAppBadge(total);
      } else {
        await nav.clearAppBadge();
      }
    } catch (e) {
      // Safari or certain contexts may throw even after feature-detection.
      console.warn('Badge update failed', e);
    }
  }
}

interface NavigatorBadge extends Navigator {
  setAppBadge(count?: number): Promise<void>;

  clearAppBadge(): Promise<void>;
}
