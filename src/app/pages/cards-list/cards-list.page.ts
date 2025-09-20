import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList,
  IonItem, IonLabel, IonButton, IonIcon, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonButtons,
  IonBackButton, IonSearchbar, IonChip, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline, mailOutline, callOutline, businessOutline } from 'ionicons/icons';
import { BusinessCardService } from '../../services/business-card.service';
import { BusinessCard } from '../../models/business-card.model';

@Component({
  selector: 'app-cards-list',
  templateUrl: './cards-list.page.html',
  styleUrls: ['./cards-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent, IonButtons,
    IonBackButton, IonSearchbar, IonChip
  ]
})
export class CardsListPage implements OnInit {
  cards: BusinessCard[] = [];
  filteredCards: BusinessCard[] = [];

  constructor(
    private cardService: BusinessCardService,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({ addOutline, trashOutline, mailOutline, callOutline, businessOutline });
  }

  ngOnInit() {
    this.loadCards();
  }

  ionViewWillEnter() {
    this.loadCards();
  }

  loadCards() {
    this.cards = this.cardService.getCards();
    this.filteredCards = [...this.cards];
  }

  filterCards(event: any) {
    const searchTerm = event.target.value?.toLowerCase() || '';

    if (!searchTerm) {
      this.filteredCards = [...this.cards];
      return;
    }

    this.filteredCards = this.cards.filter(card =>
      card.name.toLowerCase().includes(searchTerm) ||
      card.company.toLowerCase().includes(searchTerm) ||
      card.email.toLowerCase().includes(searchTerm) ||
      card.phone.includes(searchTerm)
    );
  }

  async deleteCard(card: BusinessCard, event: Event) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Delete Contact',
      message: `Delete ${card.name}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.cardService.deleteCard(card.id);
            this.loadCards();
          }
        }
      ]
    });

    await alert.present();
  }

  addNew() {
    this.router.navigate(['/scanner']);
  }

  getSourceIcon(source: string): string {
    switch(source) {
      case 'camera': return 'camera-outline';
      case 'qr': return 'qr-code-outline';
      case 'manual': return 'create-outline';
      default: return 'document-outline';
    }
  }
}
