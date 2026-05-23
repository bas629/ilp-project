import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, PortfolioDto, FinancialProfileDto } from '../../api.service';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})
export class SummaryComponent implements OnInit {
  portfolio: PortfolioDto | null = null;
  wellness: FinancialProfileDto | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.fetchDashboardData();
  }

  fetchDashboardData() {
    this.isLoading = true;
    this.errorMessage = null;

    // Load portfolio details
    this.apiService.getPortfolio().subscribe({
      next: (portfolioData) => {
        this.portfolio = portfolioData;
        
        // Load wellness details
        this.apiService.getWellnessProfile().subscribe({
          next: (wellnessData) => {
            this.wellness = wellnessData;
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error loading wellness status', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading portfolio info', err);
        this.errorMessage = 'Could not load portfolio data. Please make sure the backend is active.';
        this.isLoading = false;
      }
    });
  }

  getWellnessScoreColor(score: number): string {
    if (score >= 80) return 'var(--accent-emerald)';
    if (score >= 50) return 'var(--accent-amber)';
    return 'var(--accent-rose)';
  }

  getRiskBadgeClass(risk: number): string {
    if (risk <= 30) return 'badge-low';
    if (risk <= 60) return 'badge-med';
    if (risk <= 85) return 'badge-high';
    return 'badge-speculative';
  }

  getRiskLabel(risk: number): string {
    if (risk <= 30) return 'Conservative';
    if (risk <= 60) return 'Moderate';
    if (risk <= 85) return 'Aggressive';
    return 'Highly Speculative';
  }
}
