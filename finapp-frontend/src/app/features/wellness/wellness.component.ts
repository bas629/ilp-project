import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InrFormatPipe } from '../../shared/pipes/inr-format.pipe';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar.component';
import { GoldService } from '../../core/services/gold.service';
import { AuthService } from '../../core/services/auth.service';
import { WellnessData } from '../../core/models/gold.model';

@Component({
  selector: 'app-wellness',
  standalone: true,
  imports: [CommonModule, InrFormatPipe, ProgressBarComponent],
  templateUrl: './wellness.component.html',
  styleUrls: ['./wellness.component.scss']
})
export class WellnessComponent implements OnInit, OnDestroy {
  private goldSvc = inject(GoldService);
  private auth    = inject(AuthService);

  loading  = signal(true);
  error    = signal('');
  wellness = signal<WellnessData | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set('');
    this.goldSvc.getWellnessScore(this.auth.getCurrentUserId()).subscribe({
      next: data => { this.wellness.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load wellness score.'); this.loading.set(false); }
    });
  }

  ngOnDestroy(): void {
    this.loading.set(true);
    this.wellness.set(null);
    this.error.set('');
  }

  get score(): number  { return this.wellness()?.score ?? 0; }
  get level(): string  { return this.wellness()?.level ?? '—'; }

  get scoreColor(): string {
    if (this.score >= 80) return '#3B6D11';
    if (this.score >= 60) return '#185FA5';
    if (this.score >= 40) return '#854F0B';
    return '#A32D2D';
  }

  get badgeClass(): string {
    if (this.score >= 80) return 'badge-success';
    if (this.score >= 60) return 'badge-blue';
    if (this.score >= 40) return 'badge-warn';
    return 'badge-error';
  }

  get savingsBarPct(): number {
    return Math.min((this.wellness()?.savingsRate ?? 0) / 30 * 100, 100);
  }

  get investmentBarPct(): number {
    return Math.min((this.wellness()?.investmentRate ?? 0) / 20 * 100, 100);
  }

  get savingsDesc(): string {
    const r = this.wellness()?.savingsRate ?? 0;
    return r >= 20 ? `${r.toFixed(1)}% saved — on track` : `${r.toFixed(1)}% saved — target 20%+`;
  }

  get investmentDesc(): string {
    const r = this.wellness()?.investmentRate ?? 0;
    return r >= 15 ? `${r.toFixed(1)}% invested — on track` : `${r.toFixed(1)}% invested — target 15%+`;
  }
}
