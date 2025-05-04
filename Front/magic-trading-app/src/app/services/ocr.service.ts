// Front/magic-trading-app/src/app/services/ocr.service.ts
import { Injectable } from '@angular/core';
import { createWorker, PSM, Worker } from 'tesseract.js';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class OcrService {
  private worker: Worker | null = null;
  // Para pruebas, cambia a true si quieres forzar que aparezca en desktop
  private forceShowButton = false;
  private isMobile: boolean;

  constructor(private platform: Platform) {
    this.isMobile = this.platform.is('mobile') ||
      this.platform.is('tablet') ||
      this.forceShowButton;
  }

  public isOnMobile(): boolean {
    return this.isMobile;
  }

  public async recognizeImage(image: string): Promise<string> {
    if (!this.worker) {
      this.worker = await createWorker('eng');
      await this.worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ',-.",
      });
    }

    try {
      const { data } = await this.worker.recognize(image);
      console.log('Resultado OCR completo:', data);

      const lineas = data.text.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 3 && !l.includes("Wizards of the Coast") && !l.includes("SLD EN"));

      if (!lineas.length) {
        return data.text.trim().replace(/\s+/g, ' ');
      }

      // Estrategia 1: detectar nombre de carta (palabras capitalizadas)
      const regexNombre = /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ']+(?: [A-ZÁÉÍÓÚÑ][a-záéíóúñ']+)*)$/;
      const nombreCarta = lineas.find(l => regexNombre.test(l) && l.length <= 40);
      if (nombreCarta) {
        return nombreCarta;
      }

      // Estrategia 2: tipo de carta → nombre en línea anterior
      const tipos = ["Instant","Sorcery","Creature","Artifact","Enchantment","Planeswalker","Land"];
      const idxTipo = lineas.findIndex(l => tipos.some(t => l === t || l.startsWith(t + " —")));
      if (idxTipo > 0) {
        return lineas[idxTipo - 1];
      }

      // Estrategia 3: la línea más larga (rules) si es > 20
      const porLongitud = [...lineas].sort((a, b) => b.length - a.length);
      if (porLongitud[0]?.length > 20) {
        return porLongitud[0];
      }

      // Estrategia 4: primeras líneas válidas
      for (let i = 0; i < Math.min(5, lineas.length); i++) {
        const l = lineas[i];
        if (l.length >= 5 && l.length <= 40 && !/^\d+$/.test(l) && !/^\d{4}$/.test(l)) {
          return l;
        }
      }

      // Fallback: todo el texto limitado a 60 chars
      const texto = lineas.join(' ').replace(/\s+/g, ' ').trim();
      return texto.substring(0, Math.min(60, texto.length));
    } catch (e) {
      console.error('Error en OCR:', e);
      throw e;
    }
  }

  public async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
