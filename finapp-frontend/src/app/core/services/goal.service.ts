import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GoalDto } from '../models/goal.model';

const BASE = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class GoalService {
  private http = inject(HttpClient);

  createGoal(dto: GoalDto): Observable<GoalDto> {
    return this.http.post<GoalDto>(`${BASE}/goal`, dto);
  }

  getGoalsByUser(userId: number): Observable<GoalDto[]> {
    return this.http.get<GoalDto[]>(`${BASE}/goal/${userId}`);
  }

  updateProgress(goalId: number, amount: number): Observable<GoalDto> {
    return this.http.patch<GoalDto>(
      `${BASE}/goal/${goalId}/progress?amount=${amount}`, {}
    );
  }

  deleteGoal(goalId: number): Observable<string> {
    return this.http.delete(`${BASE}/goal/${goalId}`, { responseType: 'text' });
  }
}
