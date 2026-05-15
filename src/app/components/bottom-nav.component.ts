import {Component} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav" aria-label="Primary">
      <a routerLink="/today" routerLinkActive="active" class="tab">
        <span class="icon" aria-hidden="true">●</span>
        <span class="label">Today</span>
      </a>
      <a routerLink="/week" routerLinkActive="active" class="tab">
        <span class="icon" aria-hidden="true">▦</span>
        <span class="label">Week</span>
      </a>
      <a routerLink="/history" routerLinkActive="active" class="tab">
        <span class="icon" aria-hidden="true">☰</span>
        <span class="label">History</span>
      </a>
    </nav>
  `,
})
export class BottomNavComponent {
}
