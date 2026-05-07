import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BadgeService } from './services/badge.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private readonly badge = inject(BadgeService);
  private readonly notification = inject(NotificationService);
}
