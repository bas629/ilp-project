import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { GoalService } from '../../core/services/goal.service';
import { AuthService } from '../../core/services/auth.service';
import { GoalDto, computeStatus } from '../../core/models/goal.model';
import { InrFormatPipe } from '../../shared/pipes/inr-format.pipe';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InrFormatPipe],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss']
})
export class GoalsComponent implements OnInit, OnDestroy {
  private goalService = inject(GoalService);
  private auth        = inject(AuthService);
  private fb          = inject(FormBuilder);

  goals           = signal<GoalDto[]>([]);
  loading         = signal(true);
  saving          = signal(false);
  success         = signal('');
  error           = signal('');
  showAddForm     = signal(false);
  confirmDeleteId = signal<number | null>(null);
  updateGoalId    = signal<number | null>(null);
  updateAmount    = signal<number>(0);

  addForm = this.fb.group({
    name:         ['', [Validators.required, Validators.minLength(2)]],
    targetAmount: [null as number | null, [Validators.required, Validators.min(1)]],
    targetDate:   ['', Validators.required],
    icon:         ['ti-target']
  });

  progressPct(g: GoalDto): number {
    return g.targetAmount > 0
      ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100))
      : 0;
  }

  remaining(g: GoalDto): number {
    return Math.max(0, g.targetAmount - g.savedAmount);
  }

  progressBarClass(g: GoalDto): string {
    if (g.status === 'Completed')   return 'green';
    if (g.status === 'In Progress') return 'teal';
    return 'purple';
  }

  statusBadgeClass(g: GoalDto): string {
    if (g.status === 'Completed')   return 'badge-green';
    if (g.status === 'In Progress') return 'badge-teal';
    return 'badge-purple';
  }

  onAddGoal(): void {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }

    const userId = this.auth.getCurrentUserId();
    const val    = this.addForm.value;

    const dto: GoalDto = {
      name:         val.name!,
      targetAmount: val.targetAmount!,
      savedAmount:  0,
      targetDate:   val.targetDate!,
      status:       'Not Started',
      icon:         val.icon ?? 'ti-target',
      userId
    };

    this.saving.set(true);
    this.goalService.createGoal(dto).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Goal created successfully!');
        this.addForm.reset({ icon: 'ti-target' });
        this.showAddForm.set(false);
        setTimeout(() => this.success.set(''), 3000);
        this.loadData();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Failed to create goal.');
        setTimeout(() => this.error.set(''), 4000);
      }
    });
  }

  openUpdateProgress(goalId: number): void {
    this.updateGoalId.set(goalId);
    this.updateAmount.set(0);
  }

  cancelUpdate(): void { this.updateGoalId.set(null); }

  submitProgress(): void {
    const id     = this.updateGoalId();
    const amount = this.updateAmount();
    if (!id || amount <= 0) return;

    this.goalService.updateProgress(id, amount).subscribe({
      next: () => {
        this.updateGoalId.set(null);
        this.success.set('Progress updated!');
        setTimeout(() => this.success.set(''), 3000);
        this.loadData();
      },
      error: () => {
        this.error.set('Failed to update progress.');
        setTimeout(() => this.error.set(''), 3000);
      }
    });
  }

  askDelete(id: number | undefined): void {
    if (id != null) this.confirmDeleteId.set(id);
  }

  toggleAddForm(): void { this.showAddForm.update(v => !v); }

  cancelDelete(): void { this.confirmDeleteId.set(null); }

  confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (id == null) return;

    this.goalService.deleteGoal(id).subscribe({
      next: () => {
        this.confirmDeleteId.set(null);
        this.success.set('Goal deleted.');
        setTimeout(() => this.success.set(''), 3000);
        this.loadData();
      },
      error: () => {
        this.confirmDeleteId.set(null);
        this.error.set('Failed to delete goal.');
        setTimeout(() => this.error.set(''), 3000);
      }
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');
    const userId = this.auth.getCurrentUserId();

    this.goalService.getGoalsByUser(userId).subscribe({
      next:  (data) => { this.goals.set(data ?? []); this.loading.set(false); },
      error: ()     => { this.error.set('Failed to load goals.'); this.loading.set(false); }
    });
  }

  ngOnInit(): void   { this.loadData(); }
  ngOnDestroy(): void { this.goals.set([]); this.loading.set(true); }
}
