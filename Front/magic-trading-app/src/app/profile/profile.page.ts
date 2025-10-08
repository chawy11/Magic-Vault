
import { Component, OnInit } from '@angular/core';
import { UserprofileService } from '../services/userprofile.service';
import { ScryfallService } from '../services/scryfall.service';
import { OcrService } from '../services/ocr.service';
import { PlatformService } from '../services/platform.service';
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
  IonCheckbox, IonBadge, IonTextarea, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { AlertController, LoadingController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {search, add, create, close, trash, ellipsisVertical, arrowBack, share, star, starOutline, camera} from 'ionicons/icons';
import { lastValueFrom } from 'rxjs';
import {RouterLink} from "@angular/router";
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import {TransactionService} from "../services/transaction.service";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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
    IonModal, IonGrid, IonRow, IonCol, IonToggle, IonButtons, RouterLink, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCheckbox, IonBadge, IonTextarea, IonFab, IonFabButton
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
  isMobile: boolean = false;

  matches = {
    wantsMatches: 0,
    wantsTotal: 0,
    sellsMatches: 0,
    sellsTotal: 0
  };

  constructor(
    private userProfileService: UserprofileService,
    private scryfallService: ScryfallService,
    private alertController: AlertController,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private transactionService: TransactionService,
    private ocrService: OcrService,
    private platformService: PlatformService,
    private loadingController: LoadingController

  ) {
    addIcons({ search, add, create, close, trash, ellipsisVertical, arrowBack, share, star, starOutline, camera });
    this.currentUser = localStorage.getItem('usuario') || '';
    this.isMobile = this.platformService.isMobile();
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

  /**
   * Scan a card using the device camera and OCR
   */
  async scanCardWithCamera(): Promise<void> {
    // Check if we're on a mobile device
    if (!this.isMobile) {
      const toast = await this.toastController.create({
        message: 'La función de escaneo solo está disponible en dispositivos móviles',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    try {
      // Take a photo using the device camera
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        promptLabelHeader: 'Escanear Carta',
        promptLabelPhoto: 'Desde Galería',
        promptLabelPicture: 'Tomar Foto'
      });

      if (!image.dataUrl) {
        throw new Error('No image data received');
      }

      // Show loading indicator
      const loading = await this.loadingController.create({
        message: 'Escaneando carta...',
        spinner: 'crescent'
      });
      await loading.present();

      // Perform OCR on the image
      const cardName = await this.ocrService.scanCard(image.dataUrl);

      await loading.dismiss();

      if (!cardName || cardName.length < 2) {
        const toast = await this.toastController.create({
          message: 'No se pudo detectar el nombre de la carta. Por favor, inténtalo de nuevo asegurándote de que el nombre sea visible.',
          duration: 4000,
          color: 'warning'
        });
        await toast.present();
        return;
      }

      // Search for the card using Scryfall
      await this.searchAndAddCardByName(cardName);

    } catch (error: any) {
      console.error('Error scanning card:', error);
      
      // Dismiss loading if still present
      const loading = await this.loadingController.getTop();
      if (loading) {
        await loading.dismiss();
      }

      let errorMessage = 'Error al escanear la carta';
      
      if (error.message?.includes('User cancelled')) {
        return; // User cancelled, no need to show error
      }
      
      if (error.message) {
        errorMessage = error.message;
      }

      const toast = await this.toastController.create({
        message: errorMessage,
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  /**
   * Search for a card by name and add it to the list
   */
  private async searchAndAddCardByName(cardName: string): Promise<void> {
    try {
      // Show that we're searching
      const loading = await this.loadingController.create({
        message: `Buscando "${cardName}"...`,
        spinner: 'crescent'
      });
      await loading.present();

      // Search using Scryfall
      const searchResults = await lastValueFrom(
        this.scryfallService.buscarCartas(cardName)
      );

      await loading.dismiss();

      if (!searchResults?.data || searchResults.data.length === 0) {
        // No results found, ask user if they want to try manual search
        const alert = await this.alertController.create({
          header: 'Carta no encontrada',
          message: `No se encontró ninguna carta con el nombre "${cardName}". ¿Quieres buscar manualmente?`,
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Buscar',
              handler: () => {
                this.searchTerm = cardName;
                this.searchCards();
              }
            }
          ]
        });
        await alert.present();
        return;
      }

      // If we have results, show them to the user to confirm
      if (searchResults.data.length === 1) {
        // Only one result, ask for confirmation
        const card = searchResults.data[0];
        const alert = await this.alertController.create({
          header: 'Confirmar carta',
          message: `¿Agregar "${card.name}" a tu lista de ${this.activeSegment === 'wants' ? 'Wants' : 'Sells'}?`,
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Agregar',
              handler: () => {
                if (this.activeSegment === 'wants') {
                  this.addCardToWants(card);
                } else {
                  this.addCardToSells(card);
                }
              }
            }
          ]
        });
        await alert.present();
      } else {
        // Multiple results, let user choose
        const alert = await this.alertController.create({
          header: 'Seleccionar carta',
          message: 'Se encontraron varias cartas. Selecciona la correcta:',
          inputs: searchResults.data.slice(0, 10).map((card: any, idx: number) => ({
            type: 'radio',
            label: `${card.name}${card.set_name ? ' (' + card.set_name + ')' : ''}`,
            value: idx,
            checked: idx === 0
          })),
          buttons: [
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Agregar',
              handler: (value) => {
                const selectedCard = searchResults.data[value];
                if (this.activeSegment === 'wants') {
                  this.addCardToWants(selectedCard);
                } else {
                  this.addCardToSells(selectedCard);
                }
              }
            }
          ]
        });
        await alert.present();
      }

    } catch (error) {
      console.error('Error searching for card:', error);
      
      const loading = await this.loadingController.getTop();
      if (loading) {
        await loading.dismiss();
      }

      const toast = await this.toastController.create({
        message: 'Error al buscar la carta',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
