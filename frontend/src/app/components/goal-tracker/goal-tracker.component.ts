import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, GoalDto } from '../../api.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-goal-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goal-tracker.component.html',
  styleUrls: ['./goal-tracker.component.css']
})
export class GoalTrackerComponent implements OnInit {
  goals: GoalDto[] = [];
  cashBalance = 0;
  isLoading = true;
  isSaving = false;
  errorMessage: string | null = null;

  // New Goal model
  newGoal: GoalDto = {
    goalName: '',
    targetAmount: 0,
    deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 6, new Date().getDate())
      .toISOString().substring(0, 10) // 6 months default deadline
  };

  // Deposit modal state
  showDepositModal = false;
  selectedGoal: GoalDto | null = null;
  depositAmount = 0;
  isDepositing = false;

  constructor(
    private apiService: ApiService,
    private notifService: NotificationService
  ) {}

  ngOnInit() {
    this.loadGoalsData();
  }

  loadGoalsData() {
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.getGoals().subscribe({
      next: (goalsList) => {
        this.goals = goalsList;
        
        // Fetch wallet balance
        this.apiService.getCashBalance().subscribe({
          next: (bal) => {
            this.cashBalance = bal;
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error fetching balance', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error fetching goals list', err);
        this.errorMessage = 'Could not load goals. Make sure the backend is active.';
        this.isLoading = false;
        this.notifService.error(this.errorMessage!);
      }
    });
  }

  onSubmit() {
    if (!this.newGoal.goalName || this.newGoal.targetAmount <= 0 || !this.newGoal.deadline) {
      this.notifService.error('Please fill out all fields with valid values');
      return;
    }

    this.isSaving = true;
    this.apiService.addGoal(this.newGoal).subscribe({
      next: (created) => {
        this.isSaving = false;
        this.notifService.success('Goal established successfully');
        // Reset form
        this.newGoal.goalName = '';
        this.newGoal.targetAmount = 0;
        this.loadGoalsData();
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error creating goal', err);
        this.notifService.error('Failed to create goal. Try again.');
      }
    });
  }

  onDelete(goalId?: number) {
    if (!goalId) return;
    if (!confirm('Are you sure you want to delete this goal? Deposited funds will be refunded back to your cash wallet.')) return;

    this.isLoading = true;
    this.apiService.deleteGoal(goalId).subscribe({
      next: () => {
        this.notifService.success('Goal cancelled and balance refunded successfully');
        this.loadGoalsData();
      },
      error: (err) => {
        console.error('Error deleting goal', err);
        this.notifService.error('Failed to delete goal.');
        this.isLoading = false;
      }
    });
  }

  // --- DEPOSIT DIALOG MODAL ---
  openDepositModal(goal: GoalDto) {
    this.selectedGoal = goal;
    this.depositAmount = Math.min(50, Math.max(0, this.cashBalance)); // Quick prefill suggestion
    this.showDepositModal = true;
  }

  closeDepositModal() {
    this.showDepositModal = false;
    this.selectedGoal = null;
    this.depositAmount = 0;
    this.isDepositing = false;
  }

  isValidDeposit(): boolean {
    if (!this.selectedGoal || this.depositAmount <= 0) return false;
    
    // Check wallet balance
    if (this.depositAmount > this.cashBalance) return false;

    // Optional: limit deposit to remaining amount
    const remaining = this.selectedGoal.targetAmount - (this.selectedGoal.currentAmount || 0);
    return this.depositAmount <= remaining + 0.01; // Allow slight float rounding
  }

  executeDeposit() {
    if (!this.selectedGoal || !this.selectedGoal.goalId || !this.isValidDeposit()) return;

    this.isDepositing = true;
    this.apiService.depositToGoal(this.selectedGoal.goalId, this.depositAmount).subscribe({
      next: (res) => {
        this.isDepositing = false;
        this.notifService.success(res.message || 'Deposit processed successfully!');
        this.closeDepositModal();
        this.loadGoalsData();
      },
      error: (err) => {
        this.isDepositing = false;
        this.notifService.error(err.error?.error || 'Deposit failed. Try again.');
      }
    });
  }

  // --- HELPERS ---
  getProgressPercent(goal: GoalDto): number {
    if (!goal.targetAmount) return 0;
    const current = goal.currentAmount || 0;
    const pct = (current / goal.targetAmount) * 100;
    return Math.min(100, Math.max(0, pct));
  }

  getDaysRemaining(deadlineStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
