import { Injectable } from '@angular/core';
import {ContactInput, Contacts, PhoneType} from '@capacitor-community/contacts';
import { BusinessCard } from '../models/business-card.model';
import {
  EmailInput,
  PhoneInput,
  PostalAddressInput
} from "@capacitor-community/contacts/dist/esm/definitions";

@Injectable({ providedIn: 'root' })
export class ContactsService {

  async saveToNativeContacts(card: BusinessCard): Promise<boolean> {
    try {
      // Request permissions first
      const permission = await Contacts.requestPermissions();

      console.log(permission);

      if (permission.contacts !== 'granted') {
        throw new Error('Contacts permission denied');
      }

      // Prepare contact data
      const newContact: ContactInput = {
        name: {
          given: this.getFirstName(card.name),
          family: this.getLastName(card.name),
        },
        organization: {
          company: card.company || undefined,
          jobTitle: card.title || undefined
        }
      };

      // Add phone numbers
      if (card.phone) {
        newContact.phones = [{
          type: 'work',
          number: card.phone
        } as PhoneInput];
      }

      // Add email addresses
      if (card.email) {
        newContact.emails = [{
          type: 'work',
          address: card.email
        } as EmailInput];
      }

      // Add postal address
      if (card.address) {
        newContact.postalAddresses = [{
          type: 'work',
          street: card.address,
          label: 'Work Address'
        } as PostalAddressInput];
      }

      // Add website as note if available
      if (card.website || card.notes) {
        const noteText = [];
        if (card.website) noteText.push(`Website: ${card.website}`);
        if (card.notes) noteText.push(`Notes: ${card.notes}`);
        newContact.note = noteText.join('\n');
      }

      // Save to device contacts
      const result = await Contacts.createContact({ contact: newContact });

      console.log('Contact saved successfully:', result);
      return true;

    } catch (error) {
      console.error('Error saving to contacts:', error);
      throw error;
    }
  }

  private getFirstName(fullName: string): string {
    const parts = fullName.trim().split(' ');
    return parts[0] || '';
  }

  private getLastName(fullName: string): string {
    const parts = fullName.trim().split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }

  async checkContactsPermission(): Promise<boolean> {
    try {
      const result = await Contacts.checkPermissions();
      return result.contacts === 'granted';
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
}
