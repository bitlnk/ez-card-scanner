import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList,
  IonItem, IonLabel, IonInput, IonTextarea, IonButtons, IonSpinner,
  IonGrid, IonRow, IonCol, LoadingController, ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, qrCodeOutline, createOutline, checkmarkCircle, closeCircle, peopleOutline } from 'ionicons/icons';
import { BusinessCardService } from '../../services/business-card.service';
import { BusinessCard } from '../../models/business-card.model';
import {OcrService} from "../../services/ocr.service";
import {ApiService} from "../../services/api.service";
import {ContactsService} from "../../services/contacts.service";
import {DuplicateMatch} from "../../services/duplicate-detection.service";

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.page.html',
  styleUrls: ['./scanner.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList,
    IonItem, IonLabel, IonInput, IonTextarea, IonButtons, IonSpinner,
    IonGrid, IonRow, IonCol
  ]
})
export class ScannerPage {
  currentCard: BusinessCard | null = null;
  capturedImage: string | null = null;
  showManualForm = false;
  isProcessing = false;
  scanMode: 'none' | 'qr' = 'none';

  constructor(
    public cardService: BusinessCardService,
    private ocrService: OcrService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private apiService: ApiService,
    private contactsService: ContactsService,
    private alertCtrl: AlertController
  ) {
    addIcons({ cameraOutline, qrCodeOutline, createOutline, checkmarkCircle, closeCircle, peopleOutline });
  }

  async captureCard() {
    try {
      const loading = await this.loadingCtrl.create({ message: 'Processing OCR...' });
      await loading.present();

      const { image, base64} = await this.cardService.capturePhoto();
      this.capturedImage = image;

      this.apiService.processBusinessCard(base64).subscribe({
        next: async (response) => {
          await loading.dismiss();
          if (response.success && response.data) {
            this.currentCard = {
              id: Date.now().toString(),
              name: response.data.name || '',
              title: response.data.position || '',
              company: response.data.company || '',
              email: response.data.email || '',
              phone: response.data.phone || '',
              website: response.data.website || '',
              address: response.data.address || '',
              notes: response.data.rawText,
              imageBase64: image,
              createdAt: new Date(),
              source: 'camera'
            };
            await this.showToast('OCR parsed!', 'success');
          } else {
            this.showManualFormFallback();
            await this.showToast('Please enter details manually', 'primary');
          }
        }
      });

    } catch (error) {
      await this.loadingCtrl.dismiss();
      await this.showToast('Failed to capture image', 'danger');
      this.showManualFormFallback();
    }
  }

  async scanQRCode() {
    try {
      this.scanMode = 'qr';
      const qrData = await this.cardService.scanQRCode();
      this.scanMode = 'none';
      await this.processQRData(qrData);
    } catch (error) {
      this.scanMode = 'none';
      await this.showToast('QR scan failed', 'danger');
      this.showManualFormFallback();
    }
  }

  async processQRData(qrData: string) {
    const loading = await this.loadingCtrl.create({ message: 'Processing QR code...' });
    await loading.present();

    this.ocrService.processQRCode(qrData).subscribe({
      next: async (response) => {
        await loading.dismiss();
        if (response.success && response.data) {
          this.currentCard = {
            id: Date.now().toString(),
            name: response.data.name || '',
            title: response.data.title || '',
            company: response.data.company || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            website: response.data.website || '',
            address: response.data.address || '',
            notes: response.data,
            qrData: qrData,
            createdAt: new Date(),
            source: 'qr'
          };
          await this.showToast('QR code parsed!', 'success');
        } else {
          this.showManualFormFallback();
          await this.showToast('Please enter details manually', 'primary');
        }
      },
      error: async () => {
        await loading.dismiss();
        this.showManualFormFallback();
      }
    });
  }

  showManualFormFallback() {
    this.currentCard = this.cardService.createEmptyCard();
    this.showManualForm = true;
  }

  async saveCard() {

    if (!this.currentCard || !this.currentCard.name) {
      await this.showToast('Please enter at least a name', 'warning');
      return;
    }

    const duplicates = this.cardService.checkForDuplicates(this.currentCard);

    if (duplicates.length > 0) {
      await this.handleDuplicates(duplicates);
    } else {
      // No duplicates, proceed with normal save
      await this.showSaveOptions();
    }

  }

  private async handleDuplicates(duplicates: DuplicateMatch[]) {
    const bestMatch = duplicates[0]; // Highest scoring match

    const alert = await this.alertCtrl.create({
      header: '🔍 Duplicate Contact Found',
      message: `This contact appears similar to "${bestMatch.card.name}" (${Math.round(bestMatch.matchScore * 100)}% match).\n\nMatched: ${bestMatch.matchedFields.join(', ')}`,
      buttons: [
        {
          text: 'View Existing',
          handler: () => {
            this.showExistingCard(bestMatch.card);
          }
        },
        {
          text: 'Save as New',
          handler: async () => {
            await this.showSaveOptions(true); // Force save
          }
        },
        {
          text: 'Update Existing',
          handler: async () => {
            await this.updateExistingCard(bestMatch.card);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  private async showSaveOptions(force: boolean = false) {
    const alert = await this.alertCtrl.create({
      header: 'Save Contact',
      message: 'Where would you like to save this contact?',
      buttons: [
        {
          text: 'App Only',
          handler: () => {
            this.saveToAppOnly(force);
          }
        },
        {
          text: 'Device Contacts',
          handler: async () => {
            await this.saveToDeviceContacts(force);
          }
        },
        {
          text: 'Both',
          handler: async () => {
            await this.saveToBoth(force);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  private async updateExistingCard(existingCard: BusinessCard) {
    if (!this.currentCard) return;

    const alert = await this.alertCtrl.create({
      header: 'Update Contact',
      message: 'How would you like to update the existing contact?',
      buttons: [
        {
          text: 'Merge Information',
          handler: async () => {
            const mergedCard = this.cardService.mergeCards(existingCard, this.currentCard!);
            this.cardService.updateCard(mergedCard);

            // Also save to device if user wants
            const deviceAlert = await this.alertCtrl.create({
              header: 'Update Device Contact?',
              message: 'Would you like to update the contact on your device as well?',
              buttons: [
                { text: 'No', role: 'cancel' },
                {
                  text: 'Yes',
                  handler: async () => {
                    try {
                      await this.contactsService.saveToNativeContacts(mergedCard);
                      await this.showToast('Contact merged and updated on device!', 'success');
                    } catch (error) {
                      await this.showToast('Contact merged in app, device update failed', 'warning');
                    }
                  }
                }
              ]
            });

            await deviceAlert.present();
            await this.showToast('Contact information merged!', 'success');
            this.resetForm();
            this.router.navigate(['/cards']);
          }
        },
        {
          text: 'Replace Completely',
          handler: async () => {
            this.currentCard!.id = existingCard.id; // Keep same ID
            this.cardService.updateCard(this.currentCard!);
            await this.showToast('Contact replaced!', 'success');
            this.resetForm();
            this.router.navigate(['/cards']);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  private showExistingCard(existingCard: BusinessCard) {
    // Navigate to cards list and highlight the existing card
    this.router.navigate(['/cards'], {
      queryParams: { highlight: existingCard.id }
    });
  }

  private saveToAppOnly(force: boolean = false) {
    if (this.currentCard) {
      this.cardService.saveCard(this.currentCard, force);
      this.showToast('Contact saved to app!', 'success');
      this.resetForm();
      this.router.navigate(['/cards']);
    }
  }

  private async saveToDeviceContacts(force: boolean = false) {
    if (!this.currentCard) return;

    const loading = await this.loadingCtrl.create({
      message: 'Saving to device contacts...'
    });
    await loading.present();

    try {
      await this.contactsService.saveToNativeContacts(this.currentCard);

      // Also save to app if force save
      if (force) {
        this.cardService.saveCard(this.currentCard, true);
      }

      await loading.dismiss();
      await this.showToast('Contact saved to device!', 'success');
      this.resetForm();
    } catch (error) {
      await loading.dismiss();
      await this.showToast('Failed to save to device contacts', 'danger');
      console.error('Save error:', error);
    }
  }


  private async saveToBoth(force: boolean = false) {
    if (!this.currentCard) return;

    const loading = await this.loadingCtrl.create({
      message: 'Saving contact...'
    });
    await loading.present();

    try {
      // Save to app
      const result = this.cardService.saveCard(this.currentCard, force);

      if (result.success) {
        // Save to device
        await this.contactsService.saveToNativeContacts(this.currentCard);

        await loading.dismiss();
        await this.showToast('Contact saved to app and device!', 'success');
        this.resetForm();
        this.router.navigate(['/cards']);
      }
    } catch (error) {
      await loading.dismiss();
      // Even if device save fails, app save might have succeeded
      await this.showToast('Saved to app, but device save failed', 'warning');
      console.error('Save error:', error);
    }
  }

  resetForm() {
    this.currentCard = null;
    this.capturedImage = null;
    this.showManualForm = false;
    this.isProcessing = false;
    this.scanMode = 'none';
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message, duration: 2000, color, position: 'top'
    });
    await toast.present();
  }

  viewCards() {
    this.router.navigate(['/cards']);
  }
}

