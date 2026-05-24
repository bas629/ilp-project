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

  getWellnessColor(score?: number): string {
    if (!score) return '#9CA3AF';
    if (score >= 80) return '#3B6D11';
    if (score >= 60) return '#185FA5';
    if (score >= 40) return '#854F0B';
    return '#A32D2D';
  }

  getRiskColor(risk?: number): string {
    if (!risk) return '#9CA3AF';
    if (risk < 10) return '#3B6D11';
    if (risk < 25) return '#854F0B';
    return '#A32D2D';
  }

  getRiskLabel(risk: number): string {
    if (risk < 10) return 'Low Risk';
    if (risk < 25) return 'Moderate Risk';
    if (risk < 40) return 'High Risk';
    return 'Very High Risk';
  }
}
