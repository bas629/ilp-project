import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface AckState {
  userId: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-acknowledgement',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './acknowledgement.component.html',
  styleUrls: ['./acknowledgement.component.scss']
})
export class AcknowledgementComponent implements OnInit {
  private router = inject(Router);

  userId = '';
  name   = '';
  email  = '';

  ngOnInit(): void {
    const state = this.router.getCurrentNavigation()?.extras.state as AckState | undefined
                  ?? history.state as AckState;
    this.userId = state?.userId ?? 'USR-' + Date.now();
    this.name   = state?.name  ?? 'User';
    this.email  = state?.email ?? '';
  }
}
