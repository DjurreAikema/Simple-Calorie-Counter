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
    ctx.strokeStyle = opts.color ?? '#ef4444';
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
    <section class="page week">
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
})
export class WeekPage {
  protected readonly entryService = inject(EntryService);
  protected readonly goalService = inject(GoalService);

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
            goal > 0 && v > goal ? '#ef4444' : '#8b5cf6',
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
          backgroundColor: '#232329',
          titleColor: '#e4e4eb',
          bodyColor: '#e4e4eb',
          borderColor: '#262630',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => `${Number(ctx.parsed.y).toLocaleString()} kcal`,
          },
        },
        goalLine: {goal, color: '#ef4444'},
      },
      scales: {
        x: {
          grid: {display: false},
          ticks: {color: '#9494a8'},
        },
        y: {
          beginAtZero: true,
          grid: {color: '#262630'},
          ticks: {color: '#9494a8'},
        },
      },
    };
  });
}
