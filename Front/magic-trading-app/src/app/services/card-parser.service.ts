import { Injectable } from '@angular/core';

export interface ParsedCard {
  name: string;
  quantity: number;
  setCode?: string;
  foil?: boolean;
  collectorNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CardParserService {
  constructor() {}

  /**
   * Parse a card list from text input supporting multiple formats:
   * - Moxfield: "1x Card Name (SET) [123]" or "1 Card Name"
   * - Manabox: "1 Card Name" or "Card Name"
   * - CSV: "Quantity,Name,Set,Foil"
   * - Plain text: "Card Name"
   */
  parseCardList(text: string): ParsedCard[] {
    if (!text || !text.trim()) {
      return [];
    }

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Detect format
    if (this.isCSVFormat(text)) {
      return this.parseCSV(lines);
    } else {
      return this.parseTextFormat(lines);
    }
  }

  private isCSVFormat(text: string): boolean {
    // Check if it looks like CSV (has commas and potentially headers)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) return false;
    
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    
    // If first line has "Name" or "Quantity" it's likely CSV header
    if (firstLine.toLowerCase().includes('name') || firstLine.toLowerCase().includes('quantity')) {
      return true;
    }
    
    // If most lines have commas, it's probably CSV
    const linesWithCommas = lines.filter(line => line.includes(',')).length;
    return linesWithCommas > lines.length * 0.5;
  }

  private parseCSV(lines: string[]): ParsedCard[] {
    const cards: ParsedCard[] = [];
    let headerIndices: { [key: string]: number } = {};
    
    // Check if first line is header
    const firstLine = lines[0].toLowerCase();
    const isHeader = firstLine.includes('name') || firstLine.includes('quantity') || firstLine.includes('count');
    
    if (isHeader) {
      // Parse header to find column indices
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      headers.forEach((header, index) => {
        if (header.includes('name') || header.includes('card')) {
          headerIndices['name'] = index;
        } else if (header.includes('quantity') || header.includes('count') || header.includes('qty')) {
          headerIndices['quantity'] = index;
        } else if (header.includes('set') || header.includes('edition')) {
          headerIndices['set'] = index;
        } else if (header.includes('foil')) {
          headerIndices['foil'] = index;
        }
      });
      lines = lines.slice(1); // Skip header
    } else {
      // Assume format: Quantity,Name,Set,Foil
      headerIndices = { quantity: 0, name: 1, set: 2, foil: 3 };
    }

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      
      if (parts.length === 0) continue;
      
      const card: ParsedCard = {
        name: '',
        quantity: 1
      };
      
      // Extract name (required)
      if (headerIndices['name'] !== undefined && parts[headerIndices['name']]) {
        card.name = this.cleanCardName(parts[headerIndices['name']]);
      } else if (parts.length > 1) {
        card.name = this.cleanCardName(parts[1]);
      } else if (parts.length === 1) {
        card.name = this.cleanCardName(parts[0]);
      }
      
      // Extract quantity
      if (headerIndices['quantity'] !== undefined && parts[headerIndices['quantity']]) {
        card.quantity = parseInt(parts[headerIndices['quantity']]) || 1;
      } else if (parts.length > 0 && !isNaN(parseInt(parts[0]))) {
        card.quantity = parseInt(parts[0]) || 1;
      }
      
      // Extract set code
      if (headerIndices['set'] !== undefined && parts[headerIndices['set']]) {
        card.setCode = parts[headerIndices['set']].toUpperCase();
      }
      
      // Extract foil status
      if (headerIndices['foil'] !== undefined && parts[headerIndices['foil']]) {
        const foilValue = parts[headerIndices['foil']].toLowerCase();
        card.foil = foilValue === 'true' || foilValue === 'yes' || foilValue === '1' || foilValue === 'foil';
      }
      
      if (card.name) {
        cards.push(card);
      }
    }
    
    return cards;
  }

  private parseTextFormat(lines: string[]): ParsedCard[] {
    const cards: ParsedCard[] = [];
    
    for (const line of lines) {
      const card = this.parseTextLine(line);
      if (card && card.name) {
        cards.push(card);
      }
    }
    
    return cards;
  }

  private parseTextLine(line: string): ParsedCard | null {
    if (!line || !line.trim()) {
      return null;
    }
    
    const card: ParsedCard = {
      name: '',
      quantity: 1
    };
    
    // Pattern 1: "1x Card Name (SET) [123]" - Moxfield format
    const moxfieldPattern = /^(\d+)x?\s+(.+?)(?:\s+\(([A-Z0-9]+)\))?(?:\s+\[([0-9]+[a-z]?)\])?$/i;
    let match = line.match(moxfieldPattern);
    
    if (match) {
      card.quantity = parseInt(match[1]) || 1;
      card.name = this.cleanCardName(match[2]);
      if (match[3]) {
        card.setCode = match[3].toUpperCase();
      }
      if (match[4]) {
        card.collectorNumber = match[4];
      }
      return card;
    }
    
    // Pattern 2: "1 Card Name" or "Card Name" - Simple format
    const simplePattern = /^(\d+)\s+(.+)$/;
    match = line.match(simplePattern);
    
    if (match) {
      card.quantity = parseInt(match[1]) || 1;
      card.name = this.cleanCardName(match[2]);
      return card;
    }
    
    // Pattern 3: Just "Card Name" - no quantity
    card.name = this.cleanCardName(line);
    card.quantity = 1;
    
    return card;
  }

  private cleanCardName(name: string): string {
    // Remove extra whitespace and quotes
    return name.trim()
      .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Validate parsed cards
   */
  validateCards(cards: ParsedCard[]): { valid: ParsedCard[], invalid: string[] } {
    const valid: ParsedCard[] = [];
    const invalid: string[] = [];
    
    for (const card of cards) {
      if (!card.name || card.name.length < 2) {
        invalid.push(`Nombre de carta inválido: "${card.name}"`);
        continue;
      }
      
      if (card.quantity < 1 || card.quantity > 999) {
        invalid.push(`Cantidad inválida para "${card.name}": ${card.quantity}`);
        continue;
      }
      
      valid.push(card);
    }
    
    return { valid, invalid };
  }
}
