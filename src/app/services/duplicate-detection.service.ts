import { Injectable } from '@angular/core';
import { BusinessCard } from '../models/business-card.model';

export interface DuplicateMatch {
  card: BusinessCard;
  matchScore: number;
  matchedFields: string[];
  matchType: 'exact' | 'high' | 'medium' | 'low';
}

@Injectable({ providedIn: 'root' })
export class DuplicateDetectionService {

  findDuplicates(newCard: BusinessCard, existingCards: BusinessCard[]): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];

    for (const existingCard of existingCards) {
      const match = this.compareCards(newCard, existingCard);
      if (match.matchScore > 0.3) { // Only return significant matches
        matches.push(match);
      }
    }

    // Sort by match score (highest first)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  private compareCards(card1: BusinessCard, card2: BusinessCard): DuplicateMatch {
    const matchedFields: string[] = [];
    let totalScore = 0;
    let fieldCount = 0;

    // Email match (highest weight - 40%)
    if (card1.email && card2.email) {
      fieldCount++;
      if (this.normalizeEmail(card1.email) === this.normalizeEmail(card2.email)) {
        matchedFields.push('email');
        totalScore += 0.4;
      }
    }

    // Phone match (high weight - 30%)
    if (card1.phone && card2.phone) {
      fieldCount++;
      if (this.normalizePhone(card1.phone) === this.normalizePhone(card2.phone)) {
        matchedFields.push('phone');
        totalScore += 0.3;
      }
    }

    // Name match (medium weight - 20%)
    if (card1.name && card2.name) {
      fieldCount++;
      const nameScore = this.compareNames(card1.name, card2.name);
      if (nameScore > 0.8) {
        matchedFields.push('name');
        totalScore += 0.2 * nameScore;
      }
    }

    // Company match (lower weight - 10%)
    if (card1.company && card2.company) {
      fieldCount++;
      const companyScore = this.compareStrings(card1.company, card2.company);
      if (companyScore > 0.8) {
        matchedFields.push('company');
        totalScore += 0.1 * companyScore;
      }
    }

    // Determine match type
    let matchType: 'exact' | 'high' | 'medium' | 'low' = 'low';
    if (totalScore >= 0.9) matchType = 'exact';
    else if (totalScore >= 0.7) matchType = 'high';
    else if (totalScore >= 0.5) matchType = 'medium';

    return {
      card: card2,
      matchScore: totalScore,
      matchedFields,
      matchType
    };
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private normalizePhone(phone: string): string {
    // Remove all non-digits
    return phone.replace(/\D/g, '');
  }

  private compareNames(name1: string, name2: string): number {
    const normalize = (name: string) => name.toLowerCase().trim().replace(/\s+/g, ' ');
    const n1 = normalize(name1);
    const n2 = normalize(name2);

    if (n1 === n2) return 1.0;

    // Split names and compare parts
    const parts1 = n1.split(' ');
    const parts2 = n2.split(' ');

    let matches = 0;
    const maxParts = Math.max(parts1.length, parts2.length);

    for (const part1 of parts1) {
      for (const part2 of parts2) {
        if (part1 === part2 && part1.length > 1) {
          matches++;
          break;
        }
      }
    }

    return matches / maxParts;
  }

  private compareStrings(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    return 0;
  }
}
