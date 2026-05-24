import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  @Input() icon = 'ti-inbox';
  @Input() message = 'No data found.';
}
