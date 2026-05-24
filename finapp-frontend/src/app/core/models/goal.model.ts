export type GoalStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface GoalDto {
  goalId?:      number;
  name:         string;
  targetAmount: number;
  savedAmount:  number;
  targetDate:   string;
  status:       GoalStatus;
  icon?:        string;
  userId:       number;
}

export function computeStatus(saved: number, target: number): GoalStatus {
  const pct = target > 0 ? (saved / target) * 100 : 0;
  if (pct <= 0)   return 'Not Started';
  if (pct >= 100) return 'Completed';
  return 'In Progress';
}
