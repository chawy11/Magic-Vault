// src/app/profile/profile.page.ts

import { Component, OnInit } from '@angular/core';
import { UserprofileService } from '../services/userprofile.service';
import { ScryfallService } from '../services/scryfall.service';
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
  IonFab,
  IonFabButton,
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
  IonCheckbox, IonBadge, IonTextarea
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {search, add, create, close, trash, ellipsisVertical, arrowBack, share, star, starOutline} from 'ionicons/icons';
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
    IonSegment, IonCardSubtitle, IonSegmentButton, IonSearchbar, IonIcon, IonFab, IonFabButton,
    IonModal, IonGrid, IonRow, IonCol, IonToggle, IonButtons, RouterLink, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonCheckbox, IonBadge, IonTextarea
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
  showSearch: boolean = false;
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

  ) {
    addIcons({ search, add, create, close, trash, ellipsisVertical, arrowBack, share, star, starOutline });
    this.currentUser = localStorage.getItem('usuario') || '';
  }



  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.viewedUsername = params['username'] || this.currentUser;
      this.isOwnProfile = !params['username'] || params['username'] === this.currentUser;

      if (this.isOwnProfile) {
        this.loadProfile();
        this.loadReviews();
      } else {
        this.loadOtherUserProfile();
        this.loadMatches();
      }
    });

    // Obtener ID del usuario actual
    this.userProfileService.getMyProfile().subscribe(data => {
      this.currentUserId = data._id;
    });

    // Cargar transacciones
    this.loadTransactions();
  }

  // En profile.page.ts

  loadReviews(): void {
    console.log('Cargando valoraciones...');

    // Filtramos solo transacciones completadas
    const completedTransactions = this.transactions.filter((tx: Transaction) => tx.status === 'completed');

    // Extraemos las valoraciones
    this.reviews = [];

    completedTransactions.forEach((tx: Transaction) => {
      // Si soy el vendedor y el comprador me dejó valoración
      if (tx.sellerId === this.currentUserId && tx.buyerReview) {
        this.reviews.push({
          fromUsername: tx.buyerUsername,
          rating: tx.buyerReview.rating,
          comment: tx.buyerReview.comment,
          date: tx.buyerReview.date,
          cards: tx.buyerWants || []
        });
      }

      // Si soy el comprador y el vendedor me dejó valoración
      if (tx.buyerId === this.currentUserId && tx.sellerReview) {
        this.reviews.push({
          fromUsername: tx.sellerUsername,
          rating: tx.sellerReview.rating,
          comment: tx.sellerReview.comment,
          date: tx.sellerReview.date,
          cards: tx.sellerWants || []
        });
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

  // Mejora el método confirmTransaction para actualizar completamente los datos
  confirmTransaction(transactionId: string): void {
    this.transactionService.confirmTransaction(transactionId).subscribe(
      response => {
        this.presentToast('Transacción confirmada correctamente');

        // Recarga todas las listas para reflejar los cambios
        this.loadTransactions();

        // Forzar actualización completa
        if (this.isOwnProfile) {
          this.loadProfile();
        } else {
          this.loadOtherUserProfile();
          this.loadMatches();
        }

        // Si la transacción está completa, recarga para ver cambios inmediatos
        if (response.transactionCompleted) {
          setTimeout(() => {
            // Segunda recarga después de 500ms para asegurar que el backend actualizó todo
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
    // Guardar segmento activo
    this.activeSegment = event.detail.value;

    // Limpiar búsqueda
    this.searchTerm = '';
    this.searchResults = [];

    // Si cambia al segmento de transacciones, recargar las transacciones
    if (this.activeSegment === 'transactions') {
      this.loadTransactions();
    }

    // Si cambia a wants o sells y hay transacciones completadas, actualizar las listas
    if ((this.activeSegment === 'wants' || this.activeSegment === 'sells') &&
      this.transactions.some(tx => tx.status === 'completed')) {
      if (this.isOwnProfile) {
        this.loadProfile(); // Usar loadProfile, no loadMyProfile
      } else {
        this.loadOtherUserProfile();
      }
    }
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.searchTerm = '';
      this.searchResults = [];
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
                    this.showSearch = false;
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
    // Same implementation as addCardToWants but for sells
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
                    this.showSearch = false;
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
      // Fetch all editions of this card from Scryfall
      const printData = await lastValueFrom(this.scryfallService.getCardPrints(card.cardName));

      // Create a copy of the card for editing
      this.editingCard = {
        ...card,
        type: type,
        quantity: card.quantity || 1,
        foil: card.foil || false,
        price: card.price || 0
      };

      this.printingsMap = {}; // Reset the printings map

      // Update editions list with real editions from Scryfall
      if (printData && printData.data) {
        // Store all printings with edition name as key for easy lookup
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
      // Update the price based on the selected edition
      const price = selectedPrint.prices?.eur || selectedPrint.prices?.usd || 0;
      this.editingCard.price = parseFloat(price) || 0;

      // Also update the setCode
      this.editingCard.setCode = selectedPrint.set;
    }
  }

  saveCardChanges() {
    if (!this.editingCard) return;

    // Ensure price is a number
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


  // Preparar la transacción
  prepareTransaction(): void {
    this.transactionMode = true;

    // Cargar cartas coincidentes
    this.userProfileService.getMatchingCards(this.viewedUsername).subscribe(
      (data: any) => {
        // Añadir propiedad selected a todas las cartas
        this.myMatchingCards = (data.myMatchingCards || []).map((card: any) => ({...card, selected: false}));
        this.theirMatchingCards = (data.theirMatchingCards || []).map((card: any) => ({...card, selected: false}));
      },
      (error: any) => {
        console.error('Error al cargar cartas coincidentes:', error);
        this.presentToast('Error al preparar la transacción');
      }
    );
  }

// Cancelar el modo de transacción
  cancelTransactionMode(): void {
    this.transactionMode = false;
    this.myMatchingCards = [];
    this.theirMatchingCards = [];
  }

// Verificar si se puede enviar la transacción
  canSubmitTransaction(): boolean {
    // Se permite transacción si al menos hay una carta seleccionada (compra, venta o ambas)
    const buyerSelectedCards = this.theirMatchingCards.filter((card: any) => card.selected).length > 0;
    const sellerSelectedCards = this.myMatchingCards.filter((card: any) => card.selected).length > 0;

    return buyerSelectedCards || sellerSelectedCards;
  }

// Enviar la transacción
  submitTransaction(): void {
    // Obtener cartas seleccionadas
    const buyerWants = this.theirMatchingCards.filter((card: any) => card.selected);
    const sellerWants = this.myMatchingCards.filter((card: any) => card.selected);

    if (buyerWants.length === 0 && sellerWants.length === 0) {
      this.presentToast('Debes seleccionar al menos una carta');
      return;
    }

    if (!this.viewedUserId) {
      console.error('Error: ID de usuario del vendedor no disponible');
      this.presentToast('Error: No se puede completar la transacción sin ID de vendedor');

      // Intenta cargar el perfil nuevamente
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

    // Envía la transacción al servidor
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

  // Método para abrir el modal de reseñas
  // En profile.page.ts, modifica el método openReviewModal
  openReviewModal(transaction: any): void {
    if (!transaction) return; // Prevenir errores con transacciones nulas

    this.currentReviewTransaction = transaction;
    this.currentReviewRating = 0;
    this.currentReviewComment = '';
    this.reviewModalOpen = true; // Mover esta línea al final después de inicializar los valores
  }

// Método para cerrar el modal
  closeReviewModal(): void {
    this.reviewModalOpen = false;
    this.currentReviewTransaction = null;
  }

// Método para establecer la valoración
  setReviewRating(stars: number): void {
    this.currentReviewRating = stars;
  }

// Método para enviar la reseña
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
        // Actualizar la lista de transacciones para reflejar la nueva reseña
        this.loadTransactions();
      },
      error => {
        console.error('Error al enviar valoración:', error);
        this.presentToast('Error al enviar la valoración: ' +
          (error.error?.message || 'Error desconocido'));
      }
    );
  }

  // Añade este método a tu clase ProfilePage
  ionViewDidEnter() {
    console.log('🔄 ionViewDidEnter EJECUTADO!');

    if (this.isOwnProfile) {
      this.loadProfile();
      // Esto cargará las valoraciones desde las transacciones
      this.loadTransactions();
      // Llamamos loadReviews después de cargar las transacciones
      setTimeout(() => this.loadReviews(), 300);
    } else {
      this.loadOtherUserProfile();
      this.loadMatches();
    }
  }
}
