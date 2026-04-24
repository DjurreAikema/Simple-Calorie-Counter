import {Component, computed, input} from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  template: `
    <svg [attr.viewBox]="viewBox()" xmlns="http://www.w3.org/2000/svg">
      <circle
        [attr.cx]="center()"
        [attr.cy]="center()"
        [attr.r]="radius()"
        class="track"
        fill="none"
        [attr.stroke-width]="strokeWidth()"
      />
      <circle
        [attr.cx]="center()"
        [attr.cy]="center()"
        [attr.r]="radius()"
        class="fill"
        [class.over]="over()"
        fill="none"
        [attr.stroke-width]="strokeWidth()"
        [attr.stroke-dasharray]="circumference()"
        [attr.stroke-dashoffset]="dashOffset()"
        [attr.transform]="'rotate(-90 ' + center() + ' ' + center() + ')'"
      />
    </svg>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    .track {
      stroke: #eee;
    }

    .fill {
      stroke: #0a7;
      transition: stroke-dashoffset 0.3s ease;
    }

    .fill.over {
      stroke: #d64545;
    }
  `],
})
export class ProgressRingComponent {
  readonly consumed = input.required<number>();
  readonly goal = input.required<number>();
  readonly size = input(200);
  readonly strokeWidth = input(14);

  protected readonly center = computed(() => this.size() / 2);
  protected readonly radius = computed(() => (this.size() - this.strokeWidth()) / 2);
  protected readonly circumference = computed(() => 2 * Math.PI * this.radius());
  protected readonly viewBox = computed(() => `0 0 ${this.size()} ${this.size()}`);

  protected readonly ratio = computed(() => {
    const g = this.goal();
    if (g <= 0) return 0;
    return Math.min(this.consumed() / g, 1);
  });

  protected readonly dashOffset = computed(
    () => this.circumference() * (1 - this.ratio()),
  );

  protected readonly over = computed(() => this.consumed() > this.goal());
}
