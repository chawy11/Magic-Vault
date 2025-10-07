
import { Component, OnInit } from '@angular/core';
import { UserprofileService } from '../services/userprofile.service';
import { ScryfallService } from '../services/scryfall.service';
import { CardParserService, ParsedCard } from '../services/card-parser.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonCardSubtitle,
  IonSegmentButton,
  IonSearchbar,
  IonIcon,
  IonModal,
  IonGrid,
  IonRow,
  IonCol,
  IonToggle,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonCheckbox, IonBadge, IonTextarea, IonSpinner
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {search, add, create, close, trash, ellipsisVertical, arrowBack, share, star, starOutline, cloudUpload} from 'ionicons/icons';
import { lastValueFrom } from 'rxjs';
import {RouterLink} from "@angular/router";
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import {TransactionService} from "../services/transaction.service";

interface Transaction {
  _id: string;
  buyerId: string;
  sellerId: string;
  buyerUsername: string;
  sellerUsername: string;
  buyerWants: any[];
  sellerWants: any[];
  status: string;
  createdAt: Date;
  completedAt?: Date;
  buyerConfirmed?: boolean;
  sellerConfirmed?: boolean;
  buyerReview?: {
    rating: number;
    comment: string;
    date: Date;
  };
  sellerReview?: {
    rating: number;
    comment: string;
    date: Date;
  };
  reviewsCompleted?: boolean;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
    IonLabel, IonList, IonButton, IonInput, IonSelect, IonSelectOption,
    IonSegment, IonCardSubtitle, IonSegmentButton, IonSearchbar, IonIcon,
    IonModal, IonGrid, IonRow, IonCol, IonToggle, IonButtons, RouterLink, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCheckbox, IonBadge, IonTextarea, IonSpinner
  ]
})
export class ProfilePage implements OnInit {
  currentUser: string = '';
  wantsList: any[] = [];
  sellsList: any[] = [];
  activeSegment: string = 'wants';
  searchTerm: string = '';
  searchResults: any[] = [];
  loading: boolean = false;
  editingCard: any = null;
  editions: string[] = [];
  languages: string[] = ['English', 'Spanish', 'French', 'German', 'Italian', 'Japanese'];
  isModalOpen: boolean = false;
  printingsMap: { [key: string]: any } = {};
  viewedUsername: string = '';
  isOwnProfile: boolean = true;
  transactionMode: boolean = false;
  myMatchingCards: any[] = [];
  theirMatchingCards: any[] = [];
  viewedUserId: string = '';
  transactions: any[] = [];
  currentUserId: string = '';
  reviewModalOpen: boolean = false;
  currentReviewTransaction: any = null;
  currentReviewRating: number = 0;
  currentReviewComment: string = '';
  reviews: any[] = [];
  cartaPreview: any = null;
  previewPosition = { top: 0, left: 0 };
  isImportModalOpen: boolean = false;
  importText: string = '';
  importingCards: boolean = false;

  matches = {
    wantsMatches: 0,
    wantsTotal: 0,
    sellsMatches: 0,
    sellsTotal: 0
  };

  constructor(
    private userProfileService: UserprofileService,
    private scryfallService: ScryfallService,
    private cardParserService: CardParserService,
    private alertController: AlertController,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private transactionService: TransactionService,

  ) {
    addIcons({ search, add, create, close, trash, ellipsisVertical, arrowBack, share, star, starOutline, cloudUpload });
    this.currentUser = localStorage.getItem('usuario') || '';
  }



  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.viewedUsername = params['username'] || this.currentUser;
      this.isOwnProfile = !params['username'] || params['username'] === this.currentUser;

      this.userProfileService.getMyProfile().subscribe(data => {
        this.currentUserId = data._id;

        if (this.isOwnProfile) {
          this.loadProfile();
          this.loadTransactions();
        } else {
          this.loadOtherUserProfile();
          this.loadMatches();
          this.loadUserTransactions();
        }
      });
    });
  }

  loadUserTransactions(): void {
    if (!this.viewedUserId) return;

    this.transactionService.getMyTransactions().subscribe(
      data => {
        this.transactions = data.filter((tx: Transaction) =>
          (tx.buyerId === this.currentUserId && tx.sellerId === this.viewedUserId) ||
          (tx.sellerId === this.currentUserId && tx.buyerId === this.viewedUserId));

        this.loadReviewsFromTransactions();
      },
      error => {
        console.error('Error al cargar transacciones:', error);
      }
    );
  }

  loadReviews(): void {
    console.log('Cargando valoraciones...');

    this.loadReviewsFromTransactions();
  }

  loadReviewsFromTransactions(): void {
    const completedTransactions = this.transactions.filter((tx: Transaction) =>
      tx.status === 'completed');

    this.reviews = [];

    completedTransactions.forEach((tx: Transaction) => {
      if (!this.isOwnProfile) {
        if (tx.sellerId === this.viewedUserId && tx.buyerReview) {
          this.reviews.push({
            fromUsername: tx.buyerUsername,
            rating: tx.buyerReview.rating,
            comment: tx.buyerReview.comment,
            date: tx.buyerReview.date,
            cards: tx.buyerWants || []
          });
        }

        if (tx.buyerId === this.viewedUserId && tx.sellerReview) {
          this.reviews.push({
            fromUsername: tx.sellerUsername,
            rating: tx.sellerReview.rating,
            comment: tx.sellerReview.comment,
            date: tx.sellerReview.date,
            cards: tx.sellerWants || []
          });
        }
      } else {
        if (tx.sellerId === this.currentUserId && tx.buyerReview) {
          this.reviews.push({
            fromUsername: tx.buyerUsername,
            rating: tx.buyerReview.rating,
            comment: tx.buyerReview.comment,
            date: tx.buyerReview.date,
            cards: tx.buyerWants || []
          });
        }

        if (tx.buyerId === this.currentUserId && tx.sellerReview) {
          this.reviews.push({
            fromUsername: tx.sellerUsername,
            rating: tx.sellerReview.rating,
            comment: tx.sellerReview.comment,
            date: tx.sellerReview.date,
            cards: tx.sellerWants || []
          });
        }
      }
    });

    console.log(`${this.reviews.length} valoraciones cargadas`);
  }



  loadTransactions(): void {
    this.transactionService.getMyTransactions().subscribe(
      data => {
        this.transactions = data;
      },
      error => {
        console.error('Error al cargar transacciones:', error);
      }
    );
  }

  confirmTransaction(transactionId: string): void {
    this.transactionService.confirmTransaction(transactionId).subscribe(
      response => {
        this.presentToast('Transacción confirmada correctamente');

        this.loadTransactions();

        if (this.isOwnProfile) {
          this.loadProfile();
        } else {
          this.loadOtherUserProfile();
          this.loadMatches();
        }

        if (response.transactionCompleted) {
          setTimeout(() => {
            this.loadTransactions();
            if (this.isOwnProfile) {
              this.loadProfile();
            } else {
              this.loadOtherUserProfile();
            }
          }, 500);
        }
      },
      error => {
        console.error('Error al confirmar transacción:', error);
        this.presentToast('Error al confirmar la transacción');
      }
    );
  }

  getConfirmationStatus(transaction: any): string {
    const isBuyer = transaction.buyerId === this.currentUserId;

    if (isBuyer) {
      if (transaction.buyerConfirmed) {
        return 'Esperando confirmación del vendedor';
      } else {
        return 'Pendiente de tu confirmación';
      }
    } else {
      if (transaction.sellerConfirmed) {
        return 'Esperando confirmación del comprador';
      } else {
        return 'Pendiente de tu confirmación';
      }
    }
  }

  loadOtherUserProfile(): void {
    this.userProfileService.getProfileByUsername(this.viewedUsername).subscribe(
      data => {
        console.log('Datos recibidos del perfil:', data); // Para depuración
        this.wantsList = data.wants || [];
        this.sellsList = data.sells || [];

        if (data._id) {
          this.viewedUserId = data._id;
          console.log('ID del usuario visualizado:', this.viewedUserId);
        } else {
          console.error('Error: El ID del usuario no se ha recibido');
          this.presentToast('Error al cargar el perfil. ID de usuario no disponible.');
        }
      },
      error => {
        console.error('Error loading other user profile:', error);
        this.presentToast('Error al cargar el perfil del usuario');
      }
    );
  }

  loadMatches(): void {
    this.userProfileService.getMatches(this.viewedUsername).subscribe(
      data => {
        this.matches.wantsMatches = data.wantsMatches || 0;
        this.matches.wantsTotal = data.wantsTotal || 0;
        this.matches.sellsMatches = data.sellsMatches || 0;
        this.matches.sellsTotal = data.sellsTotal || 0;
      },
      error => console.error('Error loading matches:', error)
    );
  }

  shareProfile(): void {
    const url = `${window.location.origin}/profile/${this.currentUser}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        this.presentToast('Enlace copiado al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar enlace:', err);
      });
  }

  async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  loadProfile(): void {
    this.userProfileService.getMyProfile().subscribe(
      (data) => {
        if (data) {
          this.wantsList = data.wants || [];
          this.sellsList = data.sells || [];
        }
      },
      error => console.error('Error al cargar el perfil:', error)
    );
  }

  segmentChanged(event: any): void {
    this.activeSegment = event.detail.value;

    this.searchTerm = '';
    this.searchResults = [];

    if (this.activeSegment === 'transactions') {
      if (this.isOwnProfile) {
        this.loadTransactions();
      } else {
        this.loadUserTransactions();
      }
    }

    if (this.activeSegment === 'reviews') {
      if (this.isOwnProfile) {
        this.loadReviews();
      } else {
        this.loadReviewsFromTransactions();
      }
    }

    if ((this.activeSegment === 'wants' || this.activeSegment === 'sells')) {
      if (this.isOwnProfile) {
        this.loadProfile();
      } else {
        this.loadOtherUserProfile();
      }
    }
  }

  searchCards(): void {
    if (this.searchTerm.length < 3) {
      this.searchResults = [];
      return;
    }

    this.loading = true;
    this.scryfallService.buscarCartas(this.searchTerm).subscribe(
      data => {
        this.searchResults = data.data || [];
        this.loading = false;
      },
      error => {
        console.error('Error al buscar cartas:', error);
        this.loading = false;
      }
    );
  }

  async addCardToWants(card: any): Promise<void> {
    try {
      const printData = await lastValueFrom(this.scryfallService.getCardPrints(card.name));

      if (printData && printData.data) {
        const sortedPrints = printData.data.sort((a: any, b: any) =>
          new Date(a.released_at).getTime() - new Date(b.released_at).getTime()
        );

        const alert = await this.alertController.create({
          header: 'Seleccionar Edición',
          inputs: sortedPrints.map((print: any, idx: number) => ({
            type: 'radio',
            label: `${print.set_name} (${print.prices?.eur ? print.prices.eur + '€' : 'N/A'})`,
            value: idx,
            checked: idx === 0
          })),
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Añadir',
              handler: (value) => {
                const selectedPrint = sortedPrints[value];
                const price = selectedPrint.prices?.eur || selectedPrint.prices?.usd || 0;

                this.userProfileService.addCardToWants(
                  selectedPrint.id,
                  selectedPrint.name,
                  selectedPrint.set,
                  selectedPrint.set_name,
                  parseFloat(price) || 0
                ).subscribe(
                  () => {
                    this.loadProfile();
                    this.searchResults = [];
                    this.searchTerm = '';
                  },
                  error => console.error('Error al añadir carta a wants:', error)
                );
              }
            }
          ]
        });

        await alert.present();
      }
    } catch (error) {
      console.error('Error fetching card editions:', error);
    }
  }

  async addCardToSells(card: any): Promise<void> {
    try {
      const printData = await lastValueFrom(this.scryfallService.getCardPrints(card.name));

      if (printData && printData.data) {
        const sortedPrints = printData.data.sort((a: any, b: any) =>
          new Date(a.released_at).getTime() - new Date(b.released_at).getTime()
        );

        const alert = await this.alertController.create({
          header: 'Seleccionar Edición',
          inputs: sortedPrints.map((print: any, idx: number) => ({
            type: 'radio',
            label: `${print.set_name} (${print.prices?.eur ? print.prices.eur + '€' : 'N/A'})`,
            value: idx,
            checked: idx === 0
          })),
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Añadir',
              handler: (value) => {
                const selectedPrint = sortedPrints[value];
                const price = selectedPrint.prices?.eur || selectedPrint.prices?.usd || 0;

                this.userProfileService.addCardToSells(
                  selectedPrint.id,
                  selectedPrint.name,
                  selectedPrint.set,
                  selectedPrint.set_name,
                  parseFloat(price) || 0
                ).subscribe(
                  () => {
                    this.loadProfile();
                    this.searchResults = [];
                    this.searchTerm = '';
                  },
                  error => console.error('Error al añadir carta a sells:', error)
                );
              }
            }
          ]
        });

        await alert.present();
      }
    } catch (error) {
      console.error('Error fetching card editions:', error);
    }
  }

  async editCard(card: any, type: 'wants' | 'sells') {
    try {
      const printData = await lastValueFrom(this.scryfallService.getCardPrints(card.cardName));

      this.editingCard = {
        ...card,
        type: type,
        quantity: card.quantity || 1,
        foil: card.foil || false,
        price: card.price || 0
      };

      this.printingsMap = {};

      if (printData && printData.data) {
        printData.data.forEach((print: any) => {
          this.printingsMap[print.set_name] = print;
        });

        this.editions = printData.data.map((print: any) => print.set_name);
      }

      this.isModalOpen = true;
    } catch (error) {
      console.error('Error fetching card editions for editing:', error);
    }
  }

  onEditionChange(event: any) {
    const selectedEdition = event.detail.value;
    if (this.printingsMap[selectedEdition]) {
      const selectedPrint = this.printingsMap[selectedEdition];
      const price = selectedPrint.prices?.eur || selectedPrint.prices?.usd || 0;
      this.editingCard.price = parseFloat(price) || 0;

      this.editingCard.setCode = selectedPrint.set;
    }
  }

  saveCardChanges() {
    if (!this.editingCard) return;

    this.editingCard.price = parseFloat(this.editingCard.price) || 0;

    if (this.editingCard.type === 'wants') {
      this.userProfileService.updateCardInWants(
        this.editingCard.cardId,
        this.editingCard.quantity,
        this.editingCard.edition,
        this.editingCard.language,
        this.editingCard.foil,
        this.editingCard.price,
        this.editingCard.setCode
      ).subscribe(
        () => {
          this.isModalOpen = false;
          this.loadProfile();
        },
        error => console.error('Error al actualizar carta en wants:', error)
      );
    } else {
      this.userProfileService.updateCardInSells(
        this.editingCard.cardId,
        this.editingCard.quantity,
        this.editingCard.edition,
        this.editingCard.language,
        this.editingCard.foil,
        this.editingCard.price,
        this.editingCard.setCode
      ).subscribe(
        () => {
          this.isModalOpen = false;
          this.loadProfile();
        },
        error => console.error('Error al actualizar carta en sells:', error)
      );
    }
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async removeCardFromWants(cardId: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que quieres eliminar esta carta de tu lista de wants?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.userProfileService.removeCardFromWants(cardId).subscribe(
              () => this.loadProfile(),
              error => console.error('Error al eliminar carta de wants:', error)
            );
          }
        }
      ]
    });

    await alert.present();
  }

  async removeCardFromSells(cardId: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que quieres eliminar esta carta de tu lista de sells?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.userProfileService.removeCardFromSells(cardId).subscribe(
              () => this.loadProfile(),
              error => console.error('Error al eliminar carta de sells:', error)
            );
          }
        }
      ]
    });

    await alert.present();
  }


  prepareTransaction(): void {
    this.transactionMode = true;

    this.userProfileService.getMatchingCards(this.viewedUsername).subscribe(
      (data: any) => {
        this.myMatchingCards = (data.myMatchingCards || []).map((card: any) => ({...card, selected: false}));
        this.theirMatchingCards = (data.theirMatchingCards || []).map((card: any) => ({...card, selected: false}));
      },
      (error: any) => {
        console.error('Error al cargar cartas coincidentes:', error);
        this.presentToast('Error al preparar la transacción');
      }
    );
  }

  cancelTransactionMode(): void {
    this.transactionMode = false;
    this.myMatchingCards = [];
    this.theirMatchingCards = [];
  }

  canSubmitTransaction(): boolean {
    const buyerSelectedCards = this.theirMatchingCards.filter((card: any) => card.selected).length > 0;
    const sellerSelectedCards = this.myMatchingCards.filter((card: any) => card.selected).length > 0;

    return buyerSelectedCards || sellerSelectedCards;
  }

  submitTransaction(): void {
    const buyerWants = this.theirMatchingCards.filter((card: any) => card.selected);
    const sellerWants = this.myMatchingCards.filter((card: any) => card.selected);

    if (buyerWants.length === 0 && sellerWants.length === 0) {
      this.presentToast('Debes seleccionar al menos una carta');
      return;
    }

    if (!this.viewedUserId) {
      console.error('Error: ID de usuario del vendedor no disponible');
      this.presentToast('Error: No se puede completar la transacción sin ID de vendedor');

      this.loadOtherUserProfile();
      setTimeout(() => {
        if (this.viewedUserId) {
          this.presentToast('Información actualizada. Intenta de nuevo.');
        } else {
          this.presentToast('No se pudo obtener el ID del vendedor. Recarga la página.');
        }
      }, 1000);
      return;
    }

    console.log('Enviando transacción con sellerId:', this.viewedUserId);

    this.transactionService.createTransaction(
      this.viewedUserId,
      buyerWants,
      sellerWants
    ).subscribe(
      (response: any) => {
        this.transactionMode = false;
        this.presentToast('Transacción propuesta correctamente');
        this.loadOtherUserProfile();
        this.myMatchingCards = [];
        this.theirMatchingCards = [];
      },
      (error: any) => {
        console.error('Error al crear transacción:', error);
        this.presentToast('Error al crear la transacción: ' +
          (error.error?.message || 'Error desconocido'));
      }
    );
  }

  openReviewModal(transaction: any): void {
    if (!transaction) return;

    this.currentReviewTransaction = transaction;
    this.currentReviewRating = 0;
    this.currentReviewComment = '';
    this.reviewModalOpen = true;
  }

  closeReviewModal(): void {
    this.reviewModalOpen = false;
    this.currentReviewTransaction = null;
  }

  setReviewRating(stars: number): void {
    this.currentReviewRating = stars;
  }

  submitReview(): void {
    if (!this.currentReviewTransaction || !this.currentReviewRating) {
      return;
    }

    this.transactionService.addReview(
      this.currentReviewTransaction._id,
      this.currentReviewRating,
      this.currentReviewComment
    ).subscribe(
      response => {
        this.presentToast('Valoración enviada correctamente');
        this.closeReviewModal();
        this.loadTransactions();
      },
      error => {
        console.error('Error al enviar valoración:', error);
        this.presentToast('Error al enviar la valoración: ' +
          (error.error?.message || 'Error desconocido'));
      }
    );
  }

  ionViewDidEnter() {
    console.log('🔄 ionViewDidEnter EJECUTADO!');

    if (this.isOwnProfile) {
      this.loadProfile();
      this.loadTransactions();
    } else {
      this.loadOtherUserProfile();
      this.loadMatches();
      this.loadUserTransactions();
    }
  }

  mostrarPreview(carta: any, event: MouseEvent) {
    this.cartaPreview = carta;
    this.previewPosition = {
      top: event.clientY + 10,
      left: event.clientX + 10
    };
  }

  ocultarPreview() {
    this.cartaPreview = null;
  }

  openImportModal() {
    this.isImportModalOpen = true;
    this.importText = '';
  }

  closeImportModal() {
    this.isImportModalOpen = false;
    this.importText = '';
  }

  async importCardList() {
    if (!this.importText || !this.importText.trim()) {
      await this.presentToast('Por favor, ingresa una lista de cartas');
      return;
    }

    this.importingCards = true;

    try {
      // Parse the card list
      const parsedCards = this.cardParserService.parseCardList(this.importText);
      
      if (parsedCards.length === 0) {
        await this.presentToast('No se encontraron cartas válidas en el texto');
        this.importingCards = false;
        return;
      }

      // Validate parsed cards
      const { valid, invalid } = this.cardParserService.validateCards(parsedCards);
      
      if (invalid.length > 0) {
        console.warn('Algunas cartas no son válidas:', invalid);
      }

      if (valid.length === 0) {
        await this.presentToast('No se encontraron cartas válidas para importar');
        this.importingCards = false;
        return;
      }

      // Show progress alert
      const alert = await this.alertController.create({
        header: 'Importando cartas',
        message: `Buscando ${valid.length} carta(s) en Scryfall...`,
        backdropDismiss: false
      });
      await alert.present();

      // Lookup cards in Scryfall
      const cardsToImport: any[] = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < valid.length; i++) {
        const parsedCard = valid[i];
        try {
          // Update progress message
          alert.message = `Buscando ${i + 1}/${valid.length}: ${parsedCard.name}...`;

          // Search for the card in Scryfall
          const result = await lastValueFrom(
            this.scryfallService.searchCardByName(parsedCard.name, parsedCard.setCode)
          );

          if (result && result.data && result.data.length > 0) {
            // Get the first matching card (or the one matching the set if specified)
            let selectedCard = result.data[0];
            
            // If set code was specified, try to find exact match
            if (parsedCard.setCode && parsedCard.setCode.length > 0) {
              const setMatch = result.data.find((card: any) => 
                card.set.toUpperCase() === parsedCard.setCode!.toUpperCase()
              );
              if (setMatch) {
                selectedCard = setMatch;
              }
            }

            const price = selectedCard.prices?.eur || selectedCard.prices?.usd || 0;

            cardsToImport.push({
              cardId: selectedCard.id,
              cardName: selectedCard.name,
              quantity: parsedCard.quantity,
              setCode: selectedCard.set,
              edition: selectedCard.set_name,
              language: 'English',
              foil: parsedCard.foil || false,
              price: parseFloat(price) || 0
            });
            successCount++;
          } else {
            console.warn(`No se encontró la carta: ${parsedCard.name}`);
            failCount++;
          }
        } catch (error) {
          console.error(`Error buscando carta ${parsedCard.name}:`, error);
          failCount++;
        }

        // Add a small delay to avoid rate limiting
        if (i < valid.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      await alert.dismiss();

      if (cardsToImport.length === 0) {
        await this.presentToast('No se pudo encontrar ninguna carta en Scryfall');
        this.importingCards = false;
        return;
      }

      // Import cards via bulk endpoint
      const listType = this.activeSegment === 'wants' ? 'wants' : 'sells';
      
      this.userProfileService.bulkImportCards(listType, cardsToImport).subscribe(
        async (response) => {
          await this.presentToast(
            `${response.added} carta(s) importada(s) correctamente` + 
            (response.skipped > 0 ? `, ${response.skipped} omitida(s) (ya existían)` : '') +
            (failCount > 0 ? `, ${failCount} no encontrada(s)` : '')
          );
          this.loadProfile();
          this.closeImportModal();
          this.importingCards = false;
        },
        async (error) => {
          console.error('Error al importar cartas:', error);
          await this.presentToast('Error al importar cartas. Por favor, intenta de nuevo.');
          this.importingCards = false;
        }
      );

    } catch (error) {
      console.error('Error en el proceso de importación:', error);
      await this.presentToast('Error al procesar la lista de cartas');
      this.importingCards = false;
    }
  }
}
