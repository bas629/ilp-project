import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GoldDto, WellnessData } from '../models/gold.model';

const BASE = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class GoldService {
  private http = inject(HttpClient);

  addGold(dto: GoldDto): Observable<GoldDto> {
    return this.http.post<GoldDto>(`${BASE}/gold`, dto);
  }

  getGoldByUser(userId: number): Observable<GoldDto[]> {
    return this.http.get<GoldDto[]>(`${BASE}/gold/${userId}`);
  }

  deleteGold(goldId: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/gold/${goldId}`);
  }

  getGoldMarketPrices(): Observable<any> {
    return this.http.get<any>(`${BASE}/gold/prices`);
  }

  getWellnessScore(userId: number): Observable<WellnessData> {
    return this.http.get<WellnessData>(`${BASE}/wellness/${userId}`);
  }
}
