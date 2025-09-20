import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { BusinessCard } from '../models/business-card.model';
import {DuplicateDetectionService, DuplicateMatch} from "./duplicate-detection.service";

@Injectable({ providedIn: 'root' })
export class BusinessCardService {
  private readonly STORAGE_KEY = 'business_cards';

  constructor(private duplicateService: DuplicateDetectionService) {}

  async capturePhoto(): Promise<any> {
    const photo = await Camera.getPhoto({
      quality: 100,
      allowEditing: true,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      correctOrientation: true,
    });
    return {image: `data:image/${photo.format};base64,${photo.base64String}`, base64: photo.base64String}
  }

  checkForDuplicates(newCard: BusinessCard): DuplicateMatch[] {
    const existingCards = this.getCards();
    return this.duplicateService.findDuplicates(newCard, existingCards);
  }

  async scanQRCode(): Promise<any> {
    const result = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.ALL
    });
    if (result.ScanResult) {
      return result.ScanResult;
    }
    throw new Error('No QR code detected');
  }

  saveCard(card: BusinessCard, force: boolean = false): { success: boolean; duplicates?: DuplicateMatch[] } {
    if (!force) {
      const duplicates = this.checkForDuplicates(card);
      if (duplicates.length > 0) {
        return { success: false, duplicates };
      }
    }

    const cards = this.getCards();
    cards.unshift(card);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
    return { success: true };
  }

  getCards(): BusinessCard[] {
    const cardsJson = localStorage.getItem(this.STORAGE_KEY);
    return cardsJson ? JSON.parse(cardsJson) : [];
  }

  deleteCard(id: string): void {
    const cards = this.getCards().filter(card => card.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
  }

  updateCard(updatedCard: BusinessCard): void {
    const cards = this.getCards().map(card =>
      card.id === updatedCard.id ? updatedCard : card
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
  }

  mergeCards(existingCard: BusinessCard, newCard: BusinessCard): BusinessCard {
    return {
      ...existingCard,
      // Update fields if new card has better/more complete data
      name: newCard.name || existingCard.name,
      title: newCard.title || existingCard.title,
      company: newCard.company || existingCard.company,
      email: newCard.email || existingCard.email,
      phone: newCard.phone || existingCard.phone,
      website: newCard.website || existingCard.website,
      address: newCard.address || existingCard.address,
      notes: this.mergeNotes(existingCard.notes, newCard.notes),
      // Keep the newer image if available
      imageBase64: newCard.imageBase64 || existingCard.imageBase64,
      // Update timestamp
      createdAt: new Date(),
      // Track multiple sources
      source: this.mergeSources(existingCard.source, newCard.source)
    };
  }

  private mergeNotes(existing: string, newNotes: string): string {
    if (!existing) return newNotes;
    if (!newNotes) return existing;
    if (existing === newNotes) return existing;
    return `${existing}\n\n[Updated]: ${newNotes}`;
  }

  private mergeSources(existing: string, newSource: string): 'camera' | 'qr' | 'manual' {
    if (existing === newSource) return existing as any;
    // Prioritize camera > qr > manual
    if (existing === 'camera' || newSource === 'camera') return 'camera';
    if (existing === 'qr' || newSource === 'qr') return 'qr';
    return 'manual';
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
