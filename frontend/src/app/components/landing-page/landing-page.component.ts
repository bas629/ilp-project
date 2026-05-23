import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
  features = [
    {
      icon: 'query_stats',
      title: 'Mock Stock Exchange',
      description: 'Experience real-time simulated trading with dynamic pricing engine, volatility controls, and news catalysts.'
    },
    {
      icon: 'stars',
      title: 'Digital Gold Trading',
      description: 'Invest securely in simulated gold reserves. Monitor daily price trends and buffer your risk profile.'
    },
    {
      icon: 'account_balance_wallet',
      title: 'Smart Expense & Budgeting',
      description: 'Log and organize your credits and debits. Track visual spending distributions to check on overspending.'
    },
    {
      icon: 'favorite_border',
      title: 'Financial Wellness Score',
      description: 'Get an AI-evaluated health score based on your savings ratio, diversification, budget adherence, and goal completion.'
    }
  ];

  stats = [
    { value: '₹50K+', label: 'Seeded Starter Cash' },
    { value: '10+', label: 'Bluechip Stocks Simulated' },
    { value: '30s', label: 'Real-time Ticker Updates' },
    { value: '100%', label: 'Risk Free Simulation' }
  ];
}
