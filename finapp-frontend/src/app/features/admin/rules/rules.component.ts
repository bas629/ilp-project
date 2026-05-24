import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Rule {
  id: number;
  name: string;
  threshold: number;
  unit: string;
  enabled: boolean;
  description: string;
}

const DEFAULT_RULES: Rule[] = [
  { id: 1, name: 'High expense alert',      threshold: 75,   unit: '% of income', enabled: true,  description: 'Alert when monthly expenses exceed this % of income' },
  { id: 2, name: 'Large transaction alert', threshold: 10000, unit: '₹',          enabled: true,  description: 'Flag any single transaction above this amount' },
  { id: 3, name: 'Low balance warning',     threshold: 5000,  unit: '₹',          enabled: true,  description: 'Warn when account balance drops below this amount' },
  { id: 4, name: 'Investment target',       threshold: 20,    unit: '% of income', enabled: false, description: 'Remind to invest this percentage of monthly income' },
  { id: 5, name: 'Wellness score alert',    threshold: 50,    unit: 'score',       enabled: true,  description: 'Alert when wellness score drops below this value' },
];

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss']
})
export class RulesComponent implements OnInit {
  rules = signal<Rule[]>([]);
  toast = signal<{ msg: string; type: 'ok' | 'err' } | null>(null);

  ngOnInit(): void {
    const saved = localStorage.getItem('admin_rules');
    if (saved) {
      try {
        this.rules.set(JSON.parse(saved));
      } catch (e) {
        this.rules.set(DEFAULT_RULES);
      }
    } else {
      this.rules.set(DEFAULT_RULES);
      localStorage.setItem('admin_rules', JSON.stringify(DEFAULT_RULES));
    }
  }

  toggleRule(id: number): void {
    this.rules.update(rs => rs.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  updateThreshold(id: number, value: string): void {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      this.rules.update(rs => rs.map(r => r.id === id ? { ...r, threshold: num } : r));
    }
  }

  saveAll(): void {
    localStorage.setItem('admin_rules', JSON.stringify(this.rules()));
    this.toast.set({ msg: 'Rules & thresholds saved successfully!', type: 'ok' });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
