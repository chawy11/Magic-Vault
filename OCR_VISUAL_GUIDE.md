# OCR Card Scanning - Visual Guide

## 🎨 User Interface

### Mobile View - Profile Page

```
┌─────────────────────────────────┐
│  ← Perfil de [username]      ⋮  │ Header
├─────────────────────────────────┤
│  Wants  │ Sells │ Trans │ Rev  │ Segments
├─────────────────────────────────┤
│                                  │
│  🔍 Añadir cartas...            │ Search bar
│                                  │
│  ┌──────────────────────────┐  │
│  │ 🃏 Carta 1               │  │
│  │ Cantidad: 1              │  │
│  │ Precio: 5.00€            │  │
│  └──────────────────────────┘  │
│                                  │
│  ┌──────────────────────────┐  │ Cards list
│  │ 🃏 Carta 2               │  │
│  │ Cantidad: 2              │  │
│  │ Precio: 3.50€            │  │
│  └──────────────────────────┘  │
│                                  │
│                                  │
│                                  │
│                           📷 ◄── Camera FAB
│                          [⚪]    │ (bottom-right)
└─────────────────────────────────┘
```

### Camera Button Visibility

**Visible when:**
- ✅ On mobile device (phone/tablet)
- ✅ Viewing own profile
- ✅ On "Wants" or "Sells" tab

**Hidden when:**
- ❌ On desktop/laptop
- ❌ Viewing another user's profile
- ❌ On "Transactions" or "Reviews" tab

## 📸 OCR Flow - Step by Step

### Step 1: User Action
```
User taps camera button 📷
        ↓
Platform check: Is mobile?
        ├─ YES → Continue
        └─ NO → Show warning toast
```

### Step 2: Camera Capture
```
Open device camera
        ↓
User takes photo of card
        ↓
Photo captured as DataURL
        ↓
Show "Escaneando carta..." loading
```

### Step 3: Image Preprocessing
```
Original Image (Full Card)
┌────────────────────┐
│ ╔════════════════╗ │ ← Card border
│ ║ CARD NAME      ║ │ ← Top 20% (focus area)
│ ║                ║ │
│ ║  [Card Art]    ║ │
│ ║                ║ │
│ ║  Card Text     ║ │
│ ║                ║ │
│ ╚════════════════╝ │
└────────────────────┘

Preprocessing Steps:
1. Crop to top 20%
   ┌────────────────┐
   │ CARD NAME      │ ← Only this area
   └────────────────┘

2. Grayscale + Contrast
   ┌────────────────┐
   │ CARD NAME      │ ← Black text on white
   └────────────────┘

3. Binary Threshold
   ┌────────────────┐
   │ ████ ████      │ ← Pure black/white
   └────────────────┘

4. Scale 2x
   ┌──────────────────────────┐
   │ ████████ ████████        │ ← Larger, clearer
   └──────────────────────────┘
```

### Step 4: OCR Recognition
```
Tesseract.js Processing
        ↓
Configuration:
- PSM: SINGLE_BLOCK
- Whitelist: A-Z, a-z, comma, apostrophe, hyphen
- Preserve spaces: Yes
        ↓
Extract first line
        ↓
Clean artifacts
        ↓
Card name: "Lightning Bolt"
```

### Step 5: Card Search
```
Search Scryfall API
        ↓
Results found?
├─ NO → Show "Card not found" alert
│         └─ Option to manual search
│
└─ YES → Show results
          ├─ 1 result → Confirm dialog
          │   "¿Agregar Lightning Bolt?"
          │   [Cancelar] [Agregar]
          │
          └─ Multiple → Selection dialog
              "Seleccionar carta:"
              ⚪ Lightning Bolt (Alpha)
              ⚪ Lightning Bolt (Beta)
              ⚪ Lightning Bolt (Unlimited)
              [Cancelar] [Agregar]
```

### Step 6: Add to List
```
User confirms
        ↓
Fetch card details from Scryfall
        ↓
Show edition selection dialog
        ↓
User selects edition
        ↓
Card added to Wants/Sells
        ↓
Success toast: "Carta añadida"
```

## 🎯 Image Preprocessing Details

### Why Focus on Top 20%?

Magic: The Gathering card layout:
```
┌──────────────────┐
│ CARD NAME     ⭐ │ ← 0-15%: Card name (TARGET)
├──────────────────┤
│ Mana cost        │ ← 15-20%: Cost area
├──────────────────┤
│                  │
│   [Card Art]     │ ← 20-60%: Artwork
│                  │
├──────────────────┤
│ Type line        │ ← 60-65%: Card type
├──────────────────┤
│ Card text        │ ← 65-85%: Rules text
│ Card text        │
├──────────────────┤
│ P/T    ⚡        │ ← 85-95%: Power/Toughness
└──────────────────┘
│ Border           │ ← 95-100%: Border
```

By cropping to top 20%, we:
- ✅ Capture the card name
- ✅ Eliminate confusing card borders
- ✅ Avoid OCR reading rules text
- ✅ Reduce processing time

### Contrast Enhancement

Before:
```
Gray text on colored background
Beleren font (custom MTG font)
Low contrast with card art
```

After:
```
Pure black text on white background
Sharp edges for better recognition
High contrast for OCR accuracy
```

## 💡 Tips for Best Results

### Good Photo Examples:
```
✅ Good lighting
✅ Card name clearly visible
✅ Camera held steady
✅ Card fills most of frame
✅ Perpendicular angle
```

### Common Issues:
```
❌ Blurry photo → Retake
❌ Poor lighting → Move to brighter area
❌ Glare on card → Adjust angle
❌ Card name obscured → Clean card
❌ Tilted angle → Hold camera straight
```

## 🔧 Technical Architecture

```
┌─────────────────────────────────────────┐
│           Profile Page (UI)              │
│  - Camera FAB button                     │
│  - Loading indicators                    │
│  - Confirmation dialogs                  │
└──────────────┬──────────────────────────┘
               │
               ↓ scanCardWithCamera()
┌──────────────┴──────────────────────────┐
│         Capacitor Camera API             │
│  - Request camera permission             │
│  - Capture photo                         │
│  - Return as DataURL                     │
└──────────────┬──────────────────────────┘
               │
               ↓ ocrService.scanCard()
┌──────────────┴──────────────────────────┐
│            OCR Service                   │
│  ┌─────────────────────────────────┐   │
│  │  1. preprocessImage()            │   │
│  │     - Crop, grayscale, enhance   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  2. initWorker()                 │   │
│  │     - Configure Tesseract        │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  3. recognize()                  │   │
│  │     - Perform OCR                │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  4. extractCardName()            │   │
│  │     - Parse result               │   │
│  └─────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
               ↓ searchAndAddCardByName()
┌──────────────┴──────────────────────────┐
│         Scryfall API Service             │
│  - Search by card name                   │
│  - Fetch card details                    │
│  - Get price information                 │
└──────────────┬──────────────────────────┘
               │
               ↓ addCardToWants/Sells()
┌──────────────┴──────────────────────────┐
│       UserProfile Service                │
│  - Add card to user's list               │
│  - Update backend                        │
│  - Refresh UI                            │
└──────────────────────────────────────────┘
```

## 📱 Platform Detection

```javascript
isMobile() checks:
├─ Capacitor platform
│  ├─ Android → TRUE
│  └─ iOS → TRUE
├─ Screen width
│  ├─ < 768px → Check user agent
│  └─ ≥ 768px → FALSE
└─ User Agent
   ├─ Contains mobile keywords → TRUE
   └─ Desktop browser → FALSE
```

## 🎉 Success Indicators

When everything works:
1. ✅ Button appears on mobile
2. ✅ Camera opens on tap
3. ✅ Photo is captured
4. ✅ Loading indicator shows
5. ✅ Card name detected
6. ✅ Search finds results
7. ✅ User confirms card
8. ✅ Card added to list
9. ✅ Success toast displayed
10. ✅ List updates with new card
