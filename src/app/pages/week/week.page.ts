import {Component, computed, inject} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {ChartConfiguration, ChartType, Plugin} from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';
import {EntryService} from '../../services/entry.service';
import {GoalService} from '../../services/goal.service';
import {endOfWeek, startOfWeek} from '../../util/date.util';

type GoalLineOpts = {goal?: number; color?: string};

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    goalLine?: GoalLineOpts;
  }
}

const goalLinePlugin: Plugin<'bar', GoalLineOpts> = {
  id: 'goalLine',
  afterDatasetsDraw(chart, _args, opts) {
    if (!opts?.goal || opts.goal <= 0) return;
    const {ctx, chartArea, scales} = chart;
    const yScale = scales['y'];
    if (!yScale) return;
    const y = yScale.getPixelForValue(opts.goal);
    if (y < chartArea.top || y > chartArea.bottom) return;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = opts.color ?? '#d64545';
    ctx.lineWidth = 2;
    ctx.moveTo(chartArea.left, y);
    ctx.lineTo(chartArea.right, y);
    ctx.stroke();
    ctx.restore();
  },
};

@Component({
  selector: 'app-week',
  imports: [DatePipe, DecimalPipe, RouterLink, BaseChartDirective],
  template: `
    <section class="week">
      <header>
        <div class="title-row">
          <h1>This week</h1>
          <nav class="header-right">
            <a routerLink="/templates" class="nav-link">Templates</a>
            <a routerLink="/settings" class="nav-link">Settings</a>
          </nav>
        </div>
        <p class="range">
          {{ weekStart | date: 'MMM d' }} – {{ weekEnd | date: 'MMM d' }}
        </p>
      </header>

      @if (goalService.currentGoal() == null) {
        <p class="hint">
          <a routerLink="/settings">Set a daily goal</a> to see weekly targets.
        </p>
      }

      <div class="totals">
        <div class="total-block">
          <span class="t-label">Consumed</span>
          <span class="t-value">{{ entryService.weekTotal() | number }} kcal</span>
        </div>
        @if (weekGoal() != null) {
          <div class="total-block">
            <span class="t-label">Goal</span>
            <span class="t-value">{{ weekGoal() | number }} kcal</span>
          </div>
          <div class="total-block">
            <span class="t-label">Progress</span>
            <span class="t-value" [class.over]="goalPct()! > 100">
              {{ goalPct() | number: '1.0-0' }}%
            </span>
          </div>
        }
      </div>

      <div class="chart-wrap">
        <canvas
          baseChart
          [data]="chartData()"
          [options]="chartOptions()"
          [plugins]="chartPlugins"
          [type]="'bar'"
        ></canvas>
      </div>

      @if (entryService.weekTotal() > 0) {
        <div class="macros">
          <div class="macro">
            <span class="m-label">Protein</span>
            <span class="m-value">{{ entryService.weekMacros().protein | number: '1.0-0' }}g</span>
          </div>
          <div class="macro">
            <span class="m-label">Carbs</span>
            <span class="m-value">{{ entryService.weekMacros().carbs | number: '1.0-0' }}g</span>
          </div>
          <div class="macro">
            <span class="m-label">Fat</span>
            <span class="m-value">{{ entryService.weekMacros().fat | number: '1.0-0' }}g</span>
          </div>
          <div class="macro">
            <span class="m-label">Fiber</span>
            <span class="m-value">{{ entryService.weekMacros().fiber | number: '1.0-0' }}g</span>
          </div>
        </div>
      } @else {
        <p class="empty">Nothing logged this week yet.</p>
      }
    </section>
  `,
  styles: [`
    .week {
      padding: 1rem;
      max-width: 480px;
      margin: 0 auto;
    }

    header {
      margin-bottom: 1rem;
    }

    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .nav-link {
      font-size: 0.9rem;
      color: #0a7;
      text-decoration: none;
    }

    .range {
      margin: 0.25rem 0 0;
      color: #888;
      font-size: 0.9rem;
    }

    .hint {
      color: #666;
      font-size: 0.9rem;
      margin: 0.5rem 0;
    }

    .hint a {
      color: #0a7;
    }

    .totals {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.75rem;
      border: 1px solid #eee;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .total-block {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .t-label {
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .t-value {
      font-size: 1.05rem;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }

    .t-value.over {
      color: #d64545;
    }

    .chart-wrap {
      position: relative;
      height: 220px;
      margin-bottom: 1rem;
    }

    .macros {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      padding: 0.75rem;
      border: 1px solid #eee;
      border-radius: 8px;
    }

    .macro {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
    }

    .m-label {
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .m-value {
      font-size: 1rem;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }

    .empty {
      color: #888;
      text-align: center;
      padding: 1.5rem 0;
    }
  `],
})
export class WeekPage {
  protected readonly entryService = inject(EntryService);
  protected readonly goalService = inject(GoalService);

  // TODO: matches the staleness caveat in EntryService — these don't roll over
  // if the app is open across Sun→Mon. Fine for v1.
  protected readonly weekStart = startOfWeek();
  protected readonly weekEnd = endOfWeek();

  protected readonly chartPlugins: Plugin<'bar'>[] = [goalLinePlugin];

  protected readonly weekGoal = computed(() => {
    const g = this.goalService.currentGoal();
    return g == null ? null : g * 7;
  });

  protected readonly goalPct = computed(() => {
    const wg = this.weekGoal();
    if (wg == null || wg <= 0) return null;
    return (this.entryService.weekTotal() / wg) * 100;
  });

  protected readonly chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const totals = this.entryService.weekDailyTotals();
    const goal = this.goalService.currentGoal() ?? 0;
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          data: totals,
          backgroundColor: totals.map((v) =>
            goal > 0 && v > goal ? '#d64545' : '#0a7',
          ),
          borderRadius: 4,
          maxBarThickness: 36,
        },
      ],
    };
  });

  protected readonly chartOptions = computed<ChartConfiguration<'bar'>['options']>(() => {
    const goal = this.goalService.currentGoal() ?? 0;
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {display: false},
        tooltip: {
          callbacks: {
            label: (ctx) => `${Number(ctx.parsed.y).toLocaleString()} kcal`,
          },
        },
        goalLine: {goal, color: '#d64545'},
      },
      scales: {
        x: {grid: {display: false}},
        y: {beginAtZero: true},
      },
    };
  });
}
