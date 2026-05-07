import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {BadgeService} from './services/badge.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <router-outlet/>`,
})
export class App {
  private readonly badge = inject(BadgeService);
}
