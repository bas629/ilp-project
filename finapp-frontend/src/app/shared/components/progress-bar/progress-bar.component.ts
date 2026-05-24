import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar.component.html',
})
export class ProgressBarComponent {
  @Input() label = '';
  @Input() value = 0;
  @Input() max   = 100;
  @Input() colorClass = 'blue';

  get pct(): number {
    return Math.min(100, Math.max(0, (this.value / this.max) * 100));
  }
}
