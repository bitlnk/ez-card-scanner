
```ts
import { Component, Output, EventEmitter, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import {IonicModule, Platform} from '@ionic/angular';
import {NgIf} from "@angular/common";

interface ScannedCardData {
  name?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
}

@Component({
  selector: 'app-card-scanner',
  standalone: true,
  template: `
    <div class="scanner-container">
      <!-- Live Camera Preview (when scanning) -->
      <div class="camera-view" *ngIf="!capturedImage">
        <video
          #videoElement
          class="camera-video"
          autoplay
          playsinline
          muted>
        </video>

        <!-- Camera overlay -->
        <div class="overlay">
          <div class="guides-container">
            <div class="guide guide-top-left"></div>
            <div class="guide guide-top-right"></div>
            <div class="guide guide-bottom-left"></div>
            <div class="guide guide-bottom-right"></div>
          </div>

          <div class="card-frame">
            <div class="card-outline"></div>
          </div>

          <div class="status-message" *ngIf="!cameraReady">
            <ion-spinner name="circular" color="light"></ion-spinner>
            <p>Starting camera...</p>
          </div>
        </div>
      </div>

      <!-- Captured Image Review (after capture) -->
      <div class="captured-view" *ngIf="capturedImage">
        <img [src]="capturedImageUrl" class="captured-image" alt="Captured business card">

        <!-- Processing overlay -->
        <div class="processing-overlay" *ngIf="isProcessing">
          <div class="processing-content">
            <ion-spinner name="circular" color="light"></ion-spinner>
            <h3>Reading card...</h3>
            <p>Extracting contact information</p>
          </div>
        </div>
      </div>

      <!-- Hidden canvas for capturing -->
      <canvas #canvas class="hidden-canvas"></canvas>

      <!-- Controls (when scanning) -->
      <div class="controls" *ngIf="!capturedImage">
        <div class="capture-section">
          <button
            class="capture-button"
            (click)="captureCard()"
            [disabled]="!cameraReady || isCapturing">
            <div class="capture-inner" [class.capturing]="isCapturing"></div>
          </button>
        </div>

        <ion-button
          expand="block"
          class="scan-button"
          (click)="captureCard()"
          [disabled]="!cameraReady || isCapturing">
          <ion-icon name="scan" slot="start"></ion-icon>
          {{ isCapturing ? 'Capturing...' : 'Scan Card' }}
        </ion-button>
      </div>

      <!-- Results Sheet -->
      <div class="results-sheet" *ngIf="showResults" [class.show]="showResults">
        <div class="sheet-content">
          <div class="sheet-handle"></div>

          <!-- Success Results -->
          <div class="results-content" *ngIf="cardData && !processingError">
            <div class="success-header">
              <ion-icon name="checkmark-circle" color="success"></ion-icon>
              <h2>Card Information Found</h2>
            </div>

            <div class="card-info">
              <div class="info-item" *ngIf="cardData.name">
                <ion-icon name="person" color="medium"></ion-icon>
                <span>{{ cardData.name }}</span>
              </div>
              <div class="info-item" *ngIf="cardData.company">
                <ion-icon name="business" color="medium"></ion-icon>
                <span>{{ cardData.company }}</span>
              </div>
              <div class="info-item" *ngIf="cardData.title">
                <ion-icon name="briefcase" color="medium"></ion-icon>
                <span>{{ cardData.title }}</span>
              </div>
              <div class="info-item" *ngIf="cardData.email">
                <ion-icon name="mail" color="medium"></ion-icon>
                <span>{{ cardData.email }}</span>
              </div>
              <div class="info-item" *ngIf="cardData.phone">
                <ion-icon name="call" color="medium"></ion-icon>
                <span>{{ cardData.phone }}</span>
              </div>
            </div>

            <div class="action-buttons">
              <ion-button
                expand="block"
                fill="solid"
                color="primary"
                (click)="saveCard()">
                <ion-icon name="save" slot="start"></ion-icon>
                Save Contact
              </ion-button>

              <div class="secondary-buttons">
                <ion-button
                  expand="block"
                  fill="outline"
                  color="medium"
                  (click)="editManually()">
                  <ion-icon name="create" slot="start"></ion-icon>
                  Edit Details
                </ion-button>

                <ion-button
                  expand="block"
                  fill="clear"
                  color="medium"
                  (click)="retryCapture()">
                  <ion-icon name="camera" slot="start"></ion-icon>
                  Scan Again
                </ion-button>
              </div>
            </div>
          </div>

          <!-- Error Results -->
          <div class="error-content" *ngIf="processingError">
            <div class="error-header">
              <ion-icon name="warning" color="warning"></ion-icon>
              <h2>Unable to Read Card</h2>
              <p>We couldn't extract the text clearly from this image.</p>
            </div>

            <div class="error-suggestions">
              <h3>Try:</h3>
              <ul>
                <li>Better lighting</li>
                <li>Hold the card steadier</li>
                <li>Get closer to the text</li>
                <li>Clean the camera lens</li>
              </ul>
            </div>

            <div class="action-buttons">
              <ion-button
                expand="block"
                fill="solid"
                color="primary"
                (click)="retryCapture()">
                <ion-icon name="camera" slot="start"></ion-icon>
                Try Again
              </ion-button>

              <ion-button
                expand="block"
                fill="outline"
                color="medium"
                (click)="enterManually()">
                <ion-icon name="create" slot="start"></ion-icon>
                Enter Manually
              </ion-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <ion-button
        fill="clear"
        class="back-button"
        (click)="onBack()"
        *ngIf="!showResults">
        <ion-icon name="chevron-back" slot="icon-only" color="light"></ion-icon>
      </ion-button>
    </div>
  `,
  imports: [
    NgIf,
    IonicModule
  ],
  styles: [`
    .scanner-container {
      position: relative;
      width: 100%;
      height: 100vh;
      background: #000;
      overflow: hidden;
    }

    .camera-view, .captured-view {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .camera-video, .captured-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 1;
    }

    .hidden-canvas {
      position: absolute;
      top: -9999px;
      left: -9999px;
      visibility: hidden;
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      pointer-events: none;
    }

    .guides-container {
      position: absolute;
      top: 50px;
      left: 20px;
      right: 20px;
      bottom: 180px;
    }

    .guide {
      position: absolute;
      width: 35px;
      height: 35px;
      border: 3px solid rgba(255, 255, 255, 0.9);
      border-radius: 4px;
    }

    .guide-top-left {
      top: 0;
      left: 0;
      border-right: none;
      border-bottom: none;
    }

    .guide-top-right {
      top: 0;
      right: 0;
      border-left: none;
      border-bottom: none;
    }

    .guide-bottom-left {
      bottom: 0;
      left: 0;
      border-right: none;
      border-top: none;
    }

    .guide-bottom-right {
      bottom: 0;
      right: 0;
      border-left: none;
      border-top: none;
    }

    .card-frame {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: calc(100% - 60px);
      max-width: 500px;
      height: calc((100% - 260px) * 0.63);
      min-height: 200px;
      max-height: 320px;
    }

    .card-outline {
      width: 100%;
      height: 100%;
      border: 2px solid rgba(255, 255, 255, 0.8);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(1px);
      position: relative;
    }

    .card-outline::after {
      content: 'Position card to fill this frame';
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      text-align: center;
      white-space: nowrap;
    }

    .processing-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3;
    }

    .processing-content {
      text-align: center;
      color: white;
      padding: 30px;
    }

    .processing-content h3 {
      margin: 20px 0 10px 0;
      font-size: 20px;
      font-weight: 600;
    }

    .processing-content p {
      margin: 0;
      opacity: 0.8;
      font-size: 14px;
    }

    .status-message {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: white;
      background: rgba(0, 0, 0, 0.7);
      padding: 20px;
      border-radius: 10px;
      pointer-events: auto;
    }

    .status-message p {
      margin: 10px 0 0 0;
      font-size: 14px;
    }

    .controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 20px;
      z-index: 3;
      pointer-events: auto;
    }

    .capture-section {
      display: flex;
      justify-content: center;
      margin-bottom: 20px;
    }

    .capture-button {
      width: 70px;
      height: 70px;
      border: 3px solid rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      pointer-events: auto;
    }

    .capture-button:active {
      transform: scale(0.95);
    }

    .capture-button:disabled {
      opacity: 0.5;
    }

    .capture-inner {
      width: 50px;
      height: 50px;
      background: white;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .capture-inner.capturing {
      background: #4A90E2;
      transform: scale(0.8);
    }

    .scan-button {
      --background: #4A90E2;
      --border-radius: 25px;
      height: 50px;
      font-weight: 500;
      pointer-events: auto;
    }

    .results-sheet {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-radius: 20px 20px 0 0;
      transform: translateY(100%);
      transition: transform 0.3s ease;
      z-index: 10;
      max-height: 70vh;
      overflow-y: auto;
    }

    .results-sheet.show {
      transform: translateY(0);
    }

    .sheet-content {
      padding: 20px;
    }

    .sheet-handle {
      width: 40px;
      height: 4px;
      background: #ddd;
      border-radius: 2px;
      margin: 0 auto 20px auto;
    }

    .success-header, .error-header {
      text-align: center;
      margin-bottom: 25px;
    }

    .success-header ion-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }

    .error-header ion-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }

    .success-header h2, .error-header h2 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 22px;
    }

    .error-header p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .card-info {
      margin-bottom: 30px;
    }

    .info-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item ion-icon {
      margin-right: 15px;
      font-size: 20px;
    }

    .info-item span {
      color: #333;
      font-size: 16px;
    }

    .error-suggestions {
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 10px;
    }

    .error-suggestions h3 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 16px;
    }

    .error-suggestions ul {
      margin: 0;
      padding-left: 20px;
      color: #666;
    }

    .error-suggestions li {
      margin-bottom: 5px;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .secondary-buttons {
      display: flex;
      gap: 12px;
    }

    .secondary-buttons ion-button {
      flex: 1;
    }

    .back-button {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 4;
      --color: white;
      pointer-events: auto;
    }

    @media (max-width: 1200px) {
      .card-frame {
        width: calc(90vw);
        height: calc(90vw * 0.584); /* Maintains 1083:633 ratio (633/1083 = 0.584) */
        max-width: 1083px;
        max-height: 633px;
      }
    }

    @media (max-height: 800px) {
      .card-frame {
        width: calc(80vh * 1.711); /* Maintains 1083:633 ratio (1083/633 = 1.711) */
        height: calc(80vh);
        max-width: 1083px;
        max-height: 633px;
      }

      .controls {
        padding: 15px;
      }

      .guides-container {
        bottom: 160px;
        left: 15px;
        right: 15px;
      }
    }
  `]
})
export class CardScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: false }) canvas!: ElementRef<HTMLCanvasElement>;

  @Output() cardScanned = new EventEmitter<string>();
  @Output() cardDataExtracted = new EventEmitter<ScannedCardData>();
  @Output() manualEntry = new EventEmitter<string>(); // Emits base64 for manual entry
  @Output() back = new EventEmitter<void>();

  private mediaStream: MediaStream | null = null;
  cameraReady = false;
  isCapturing = false;
  isProcessing = false;
  showResults = false;
  processingError = false;

  capturedImage: string | null = null;
  capturedImageUrl: string | null = null;
  cardData: ScannedCardData | null = null;

  constructor(private platform: Platform) {}

  async ngOnInit() {
    await this.startCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  private async startCamera() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 15 } // Smooth preview
        },
        audio: false
      });

      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.mediaStream;
        this.videoElement.nativeElement.onloadedmetadata = () => {
          this.cameraReady = true;
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }

  private stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.cameraReady = false;
  }

  async captureCard() {
    if (!this.cameraReady || !this.videoElement || !this.canvas) {
      return;
    }

    try {
      this.isCapturing = true;

      const video = this.videoElement.nativeElement;
      const canvas = this.canvas.nativeElement;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
      this.capturedImage = base64;
      this.capturedImageUrl = `data:image/jpeg;base64,${base64}`;

      // Stop camera and start processing
      this.stopCamera();
      await this.processCard(base64);

    } catch (error) {
      console.error('Error capturing card:', error);
    } finally {
      this.isCapturing = false;
    }
  }

  private async processCard(base64: string) {
    this.isProcessing = true;
    this.processingError = false;

    try {
      // Simulate OCR processing - replace with your actual OCR service
      await this.simulateOCRProcessing(base64);

    } catch (error) {
      console.error('Error processing card:', error);
      this.processingError = true;
    } finally {
      this.isProcessing = false;
      this.showResults = true;
    }
  }

  private async simulateOCRProcessing(base64: string): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Simulate success/failure (80% success rate for demo)
    const isSuccess = Math.random() > 0.2;

    if (isSuccess) {
      // Mock extracted data
      this.cardData = {
        name: 'John Doe',
        company: 'Acme Corporation',
        title: 'Senior Software Engineer',
        email: 'john.doe@acme.com',
        phone: '+1 (555) 123-4567',
        website: 'www.acme.com'
      };
    } else {
      throw new Error('OCR processing failed');
    }
  }

  saveCard() {
    if (this.cardData) {
      this.cardDataExtracted.emit(this.cardData);
    }
  }

  editManually() {
    if (this.capturedImage) {
      this.manualEntry.emit(this.capturedImage);
    }
  }

  enterManually() {
    if (this.capturedImage) {
      this.manualEntry.emit(this.capturedImage);
    }
  }

  retryCapture() {
    this.resetScanner();
    this.startCamera();
  }

  dismissResults() {
    this.resetScanner();
    this.startCamera();
  }

  private resetScanner() {
    this.capturedImage = null;
    this.capturedImageUrl = null;
    this.cardData = null;
    this.showResults = false;
    this.isProcessing = false;
    this.processingError = false;
  }

  onBack() {
    if (this.showResults) {
      this.resetScanner();
      this.startCamera();
    } else {
      this.stopCamera();
      this.back.emit();
    }
  }
}

```
