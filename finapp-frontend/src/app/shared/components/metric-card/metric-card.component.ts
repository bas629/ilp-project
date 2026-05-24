import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InrFormatPipe } from '../../pipes/inr-format.pipe';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, InrFormatPipe],
  templateUrl: './metric-card.component.html',
})
export class MetricCardComponent {
  @Input() label = '';
  @Input() value: number = 0;
  @Input() icon = '';
  @Input() colorClass = '';
  @Input() sub = '';
  @Input() isCurrency = true;
}
