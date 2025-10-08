import { Platform } from '@ionic/angular/standalone';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  constructor(private platform: Platform) {}

  /**
   * Check if the app is running on a mobile device
   * This includes both mobile web and native mobile apps
   */
  isMobile(): boolean {
    // Check if running on Android or iOS
    const isMobilePlatform = this.platform.is('android') || this.platform.is('ios');
    
    // Also check screen width for mobile web
    const isMobileWidth = this.platform.width() < 768;
    
    // Check if it's a mobile device using user agent (for web)
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    return isMobilePlatform || (isMobileWidth && isMobileUA);
  }

  /**
   * Check if the device has camera capabilities
   */
  hasCamera(): boolean {
    return this.isMobile() || 'mediaDevices' in navigator;
  }
}
