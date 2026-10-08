import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartData,
  ChartOptions,
  ChartType,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);

/**
 * Canvas that draws a Chart.js chart and redraws it when its data or options change,
 * replacing the PrimeVue Chart of the Vue version.
 */
@Component({
  selector: 'app-chart-canvas',
  template: `<canvas
    #canvas
    role="img"
    [attr.aria-label]="ariaLabel()"
  ></canvas>`,
  styles: `
    :host {
      display: block;
      position: relative;
    }
  `,
})
export class ChartCanvasComponent {
  /** Chart type; mixed charts set the type of each dataset. */
  readonly type = input.required<ChartType>();
  /** Labels and datasets. */
  readonly data = input.required<ChartData>();
  /** Chart.js options. */
  readonly options = input<ChartOptions>({});
  /** Accessible description of the chart. */
  readonly ariaLabel = input('');

  private readonly canvas =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | null = null;

  constructor() {
    afterNextRender(() => {
      this.chart = new Chart(this.canvas().nativeElement, {
        type: untracked(this.type),
        data: untracked(this.data),
        options: untracked(this.options),
      });
    });
    effect(() => {
      const data = this.data();
      const options = this.options();
      if (!this.chart) return;
      this.chart.data = data;
      this.chart.options = options;
      this.chart.update();
    });
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}
