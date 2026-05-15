import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {BottomNavComponent} from '../components/bottom-nav.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    <div class="layout">
      <main class="main">
        <router-outlet/>
      </main>
      <app-bottom-nav/>
    </div>
  `,
})
export class MainLayoutComponent {
}
