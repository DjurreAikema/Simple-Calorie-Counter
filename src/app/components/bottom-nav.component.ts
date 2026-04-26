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
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 56px;
      background: white;
      border-top: 1px solid #eee;
      display: flex;
      box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.04);
      z-index: 5;
    }

    .tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.15rem;
      text-decoration: none;
      color: #999;
      font-size: 0.75rem;
    }

    .tab.active {
      color: #0a7;
    }

    .icon {
      font-size: 1.1rem;
      line-height: 1;
    }

    .label {
      font-size: 0.7rem;
    }
  `],
})
export class BottomNavComponent {
}
