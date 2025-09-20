import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/business-card.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'http://10.50.50.91:3000/api/v1';

  constructor(private http: HttpClient) {}

  processBusinessCard(imageBase64: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}`, {
      base64Image: imageBase64
    });
  }
}
