import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/business-card.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'https://your-api-endpoint.com/api';

  constructor(private http: HttpClient) {}

  processBusinessCard(imageBase64: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/process-card`, {
      image: imageBase64,
      type: 'business_card'
    });
  }

  processQRCode(qrData: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/process-qr`, {
      qrData: qrData,
      type: 'qr_code'
    });
  }
}
