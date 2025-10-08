# Magic Vault - MTG Trading Platform

A web platform that standardizes and automates Magic: The Gathering card trading through smart matching algorithms.


## 🚀 Features

- **Card Search & Management**: Integrated with Scryfall API for real-time market prices
- **Smart Matching System**: Automatic matches between users' Want/Sell lists
- **Secure Trading**: Bilateral confirmation system and user reviews
- **User Profiles**: Shareable links with complete trading history
- **OCR Card Scanning** (Mobile): Scan physical Magic cards using your device's camera to add them to your lists
  - Advanced image preprocessing to handle card borders and enhance text recognition
  - Optimized for Magic: The Gathering's custom Beleren font
  - Automatic card name extraction and Scryfall integration

## 🛠️ Tech Stack

- **Frontend**: Ionic + Angular 19, TypeScript, RxJS  
- **Backend**: Node.js + Express, JWT Authentication  
- **Database**: MongoDB with Mongoose ODM  
- **External API**: Scryfall Magic: The Gathering API
- **OCR**: Tesseract.js with custom preprocessing for card recognition
- **Camera**: Capacitor Camera API for native camera access

## 🚧 Future Enhancements (Work in progress)

- Multi-language card search

- List import from Moxfield/Deckstats

- Premium features (multiple lists, advanced filters)

- Mobile app deployment

