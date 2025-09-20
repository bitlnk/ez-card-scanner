import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ApiResponse } from '../models/business-card.model';

@Injectable({ providedIn: 'root' })
export class OcrService {

  // Process business card image locally
  processBusinessCard(imageBase64: string): Observable<ApiResponse> {
    // Since we removed API, create empty card data
    // User will fill in manually
    return of({
      success: false,
      data: {},
      message: 'Please enter contact details manually'
    }).pipe(delay(500));
  }

  // Process QR code data locally
  processQRCode(qrData: string): Observable<ApiResponse> {
    // Parse vCard format if QR contains contact info
    const parsedData = this.parseVCard(qrData);

    return of({
      success: parsedData !== null,
      data: parsedData || {},
      message: parsedData ? 'QR code parsed successfully' : 'Please enter details manually'
    }).pipe(delay(300));
  }

  // Parse vCard format from QR codes
  private parseVCard(vCardString: string): any {
    if (!vCardString.includes('BEGIN:VCARD')) {
      return null;
    }

    const data: any = {};
    const lines = vCardString.split('\n');

    for (const line of lines) {
      if (line.startsWith('FN:')) {
        data.name = line.substring(3).trim();
      } else if (line.startsWith('TITLE:')) {
        data.title = line.substring(6).trim();
      } else if (line.startsWith('ORG:')) {
        data.company = line.substring(4).trim();
      } else if (line.startsWith('EMAIL')) {
        const email = line.split(':')[1];
        if (email) data.email = email.trim();
      } else if (line.startsWith('TEL')) {
        const phone = line.split(':')[1];
        if (phone) data.phone = phone.trim();
      } else if (line.startsWith('URL:')) {
        data.website = line.substring(4).trim();
      } else if (line.startsWith('ADR')) {
        const addr = line.split(':')[1];
        if (addr) {
          data.address = addr.split(';').filter(p => p).join(', ').trim();
        }
      }
    }

    return Object.keys(data).length > 0 ? data : null;
  }
}
