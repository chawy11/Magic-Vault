import { Injectable } from '@angular/core';
import { createWorker, Worker, PSM } from 'tesseract.js';

@Injectable({
  providedIn: 'root'
})
export class OcrService {
  private worker: Worker | null = null;

  constructor() {}

  /**
   * Initialize the Tesseract worker
   */
  private async initWorker(): Promise<Worker> {
    if (this.worker) {
      return this.worker;
    }

    const worker = await createWorker('eng', 1, {
      logger: (m) => console.log('[Tesseract]', m)
    });

    // Configure Tesseract for better card text recognition
    // Use LSTM mode which is better for fonts
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Assume a single uniform block of text
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz,\' -', // MTG card names use these
      preserve_interword_spaces: '1'
    });

    this.worker = worker;
    return worker;
  }

  /**
   * Preprocess the image to improve OCR accuracy for MTG cards
   * This handles card borders and enhances text contrast
   */
  private preprocessImage(imageData: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size - focus on top portion where card name is
        // MTG cards have the name in the top ~15% of the card
        const focusHeight = Math.floor(img.height * 0.20); // Top 20% of card
        canvas.width = img.width;
        canvas.height = focusHeight;

        // Draw the top portion of the image
        ctx.drawImage(img, 0, 0, img.width, focusHeight, 0, 0, img.width, focusHeight);

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convert to grayscale and increase contrast
        for (let i = 0; i < data.length; i += 4) {
          // Calculate grayscale value
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          
          // Apply contrast enhancement
          // This helps separate text from background
          const contrast = 1.5;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const enhancedGray = factor * (gray - 128) + 128;
          
          // Apply threshold to make text more distinct
          const threshold = 120;
          const finalValue = enhancedGray > threshold ? 255 : 0;
          
          data[i] = finalValue;     // R
          data[i + 1] = finalValue; // G
          data[i + 2] = finalValue; // B
        }

        ctx.putImageData(imageData, 0, 0);

        // Scale up for better OCR
        const scaledCanvas = document.createElement('canvas');
        const scaledCtx = scaledCanvas.getContext('2d');
        if (!scaledCtx) {
          reject(new Error('Could not get scaled canvas context'));
          return;
        }

        const scale = 2;
        scaledCanvas.width = canvas.width * scale;
        scaledCanvas.height = canvas.height * scale;
        
        // Use better image smoothing
        scaledCtx.imageSmoothingEnabled = false;
        scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

        resolve(scaledCanvas.toDataURL());
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageData;
    });
  }

  /**
   * Extract card name from OCR text
   * MTG card names are typically in the first line
   */
  private extractCardName(ocrText: string): string {
    // Clean up the text
    let cleaned = ocrText.trim();
    
    // Split by lines and take the first non-empty line
    const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return '';
    }

    // Get the first line (typically the card name)
    let cardName = lines[0];

    // Remove common OCR artifacts (replace with space to maintain word boundaries)
    cardName = cardName.replace(/[|_]/g, ' ').trim();
    
    // Remove trailing set codes (e.g., "JN", "M21", "KHM", "AFR", "2X2", etc.)
    // Set codes are typically 2-4 characters (letters/numbers) at the end, separated by space
    // This must be done before removing trailing numbers to handle mixed codes like "M21"
    cardName = cardName.replace(/\s+[A-Z0-9]{2,4}$/g, '').trim();
    
    // Remove pure trailing numbers (like collector numbers)
    cardName = cardName.replace(/\s+[0-9]+$/g, '').trim();
    
    cardName = cardName.replace(/\s+/g, ' '); // Normalize whitespace

    return cardName;
  }

  /**
   * Perform OCR on a card image
   */
  async scanCard(imageData: string): Promise<string> {
    try {
      // Preprocess the image
      const processedImage = await this.preprocessImage(imageData);

      // Initialize worker if needed
      const worker = await this.initWorker();

      // Perform OCR
      const { data } = await worker.recognize(processedImage);
      
      console.log('Raw OCR result:', data.text);

      // Extract and return the card name
      const cardName = this.extractCardName(data.text);
      console.log('Extracted card name:', cardName);

      return cardName;
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to scan card. Please try again.');
    }
  }

  /**
   * Cleanup the worker when done
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
