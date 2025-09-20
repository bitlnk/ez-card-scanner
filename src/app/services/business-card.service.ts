import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { BusinessCard } from '../models/business-card.model';

@Injectable({ providedIn: 'root' })
export class BusinessCardService {
  private readonly STORAGE_KEY = 'business_cards';

  async capturePhoto(): Promise<string> {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    });
    return `data:image/${photo.format};base64,${photo.base64String}`;
  }

  async scanQRCode(): Promise<any> {
    const result = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.ALL
    });
    if (result) {
      return result;
    }
    throw new Error('No QR code detected');
  }

  saveCard(card: BusinessCard): void {
    const cards = this.getCards();
    cards.unshift(card);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
  }

  getCards(): BusinessCard[] {
    const cardsJson = localStorage.getItem(this.STORAGE_KEY);
    return cardsJson ? JSON.parse(cardsJson) : [];
  }

  deleteCard(id: string): void {
    const cards = this.getCards().filter(card => card.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
  }

  createEmptyCard(): BusinessCard {
    return {
      id: Date.now().toString(),
      name: '', title: '', company: '', email: '', phone: '',
      website: '', address: '', notes: '',
      createdAt: new Date(),
      source: 'manual'
    };
  }
}
