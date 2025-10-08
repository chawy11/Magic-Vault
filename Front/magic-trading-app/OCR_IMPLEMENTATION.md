# OCR Card Scanning Feature - Implementation Guide

## Overview
This feature allows mobile users to scan physical Magic: The Gathering cards using their device's camera and automatically add them to their Wants or Sells lists.

## How It Works

### 1. User Flow
1. User navigates to their profile page on a mobile device
2. Switches to either "Wants" or "Sells" tab
3. Taps the floating camera button (appears in bottom-right corner)
4. Takes a photo of their Magic card
5. The app processes the image using OCR
6. The app searches for the card on Scryfall
7. User confirms the card and it's added to their list

### 2. Technical Architecture

#### OCR Service (`ocr.service.ts`)
The core of the scanning functionality with three main phases:

**Phase 1: Image Preprocessing**
- Crops image to top 20% (where card names are located in MTG cards)
- Converts to grayscale
- Applies contrast enhancement (factor of 1.5)
- Applies binary threshold (120) to separate text from background
- Scales up image 2x for better OCR accuracy

**Phase 2: OCR Recognition**
- Uses Tesseract.js with English language model
- Configured with PSM.SINGLE_BLOCK mode (best for card names)
- Character whitelist: `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz,' -`
- Preserves inter-word spaces for multi-word card names

**Phase 3: Text Extraction**
- Takes first non-empty line from OCR result
- Removes trailing numbers and common artifacts
- Normalizes whitespace

#### Platform Service (`platform.service.ts`)
Detects if the app is running on a mobile device by checking:
- Capacitor platform detection (Android/iOS)
- Screen width (< 768px)
- User agent string

#### Profile Page Integration
- Added `isMobile` property to track device type
- Added `scanCardWithCamera()` method to handle the scanning flow
- Added `searchAndAddCardByName()` private method to search Scryfall and add cards
- Shows loading indicators during OCR processing
- Displays confirmation dialogs before adding cards

### 3. Improvements Over Previous Implementation

The previous attempt with Tesseract.js failed because:
1. **Card borders**: Dark borders confused the OCR
2. **Beleren font**: MTG's custom font is difficult for OCR

This implementation solves these issues:
1. **Cropping**: Only processes top 20% of image, avoiding borders
2. **Preprocessing**: Heavy image processing improves text clarity
3. **Configuration**: Proper Tesseract settings for block text
4. **Validation**: User confirmation prevents incorrect additions

### 4. Usage Requirements

**For Mobile Devices:**
- Android or iOS device with camera
- Capacitor native app or mobile web browser with camera access
- Permission to access camera (requested on first use)

**Not Available:**
- Desktop computers (button won't appear)
- Devices without camera

### 5. Testing Notes

To test this feature:
1. Build the Capacitor app: `npx cap build android` or `npx cap build ios`
2. Install on a physical device (emulators may not have camera access)
3. Navigate to profile and ensure the camera button appears
4. Test with various MTG cards, focusing on getting good lighting and angle
5. Verify that OCR correctly identifies card names and adds them to lists

## Future Enhancements

Possible improvements:
- Support for multiple cards in one scan
- Better handling of split cards and double-faced cards
- Training a custom OCR model specifically for the Beleren font
- Image quality guidance (lighting, angle tips)
- Batch scanning mode
- Support for different card orientations

## Dependencies

- `@capacitor/camera`: ^7.0.0 - Native camera access
- `tesseract.js`: ^6.0.0 - OCR engine
- `@ionic/angular`: ^8.0.0 - Mobile UI framework
- `@capacitor/core`: ^7.0.1 - Capacitor runtime

## Configuration

No additional configuration required. The feature automatically detects mobile devices and shows/hides the camera button accordingly.

## Troubleshooting

**Button doesn't appear:**
- Ensure you're on a mobile device or mobile viewport
- Check that you're on Wants or Sells tab
- Verify that `isOwnProfile` is true (feature only for your own profile)

**OCR fails to recognize card:**
- Ensure good lighting
- Hold camera steady
- Make sure card name is clearly visible
- Try different angles if first attempt fails
- Manually search if OCR continues to fail

**Camera permission denied:**
- Check device settings to ensure app has camera permission
- Reload the app after granting permission
