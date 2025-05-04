import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController } from '@ionic/angular';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonTitle,
  IonToolbar,
  IonList, IonIcon,
} from '@ionic/angular/standalone';
import { AuthService } from "../services/auth.service";
import { ScryfallService } from "../services/scryfall.service";
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { Router } from '@angular/router';
import {addIcons} from "ionicons";
import {logOutOutline, personCircleOutline, search, star, starOutline} from "ionicons/icons";
import { OcrService } from '../services/ocr.service';
import {UserprofileService} from "../services/userprofile.service";


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonButtons,
    IonButton,
    IonNote,
    IonItem,
    IonLabel,
    IonInput,
    IonList,
    IonIcon,
  ]
})
export class HomePage implements OnInit {
  nombreCarta: string = ''; // Para almacenar lo que el usuario escribe en el input
  searchResults: any[] = []; // Almacenaremos los resultados de la búsqueda de autocompletado
  loading: boolean = false; // Para saber si estamos cargando los resultados de la búsqueda
  errorMessage: string = ''; // Para manejar mensajes de error
  cartaPreview: any = null;
  previewPosition = { top: 0, left: 0 };
  private searchTerms = new Subject<string>(); // Subject para manejar la búsqueda en tiempo real

  constructor(
    private alertController: AlertController,
    private userProfileService: UserprofileService,
    public ocrService: OcrService,
    private authService: AuthService,
    private scryfallService: ScryfallService,
    private router: Router
  ) {
    addIcons({search, personCircleOutline, logOutOutline});
  }

  ngOnInit(): void {
    // Configuramos la búsqueda en tiempo real con debounce
    this.searchTerms.pipe(
      debounceTime(300), // Espera 300ms después de cada tecla
      distinctUntilChanged(), // Ignora si el término no cambió
      switchMap(term => {
        this.loading = true;
        return this.scryfallService.buscarCartas(term).pipe(
          catchError(error => {
            this.loading = false;
            this.errorMessage = 'No se encontraron resultados.';
            return of({ data: [] }); // Devuelve un array vacío en caso de error
          })
        );
      })
    ).subscribe(
      data => {
        this.searchResults = data.data || []; // Asigna los resultados o un array vacío
        this.loading = false;
      },
      error => {
        this.loading = false;
        this.errorMessage = 'Error al buscar cartas.';
        console.error('Error al buscar cartas:', error);
      }
    );
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

  async escanearCarta() {
    if (!this.ocrService.isOnMobile()) {
      alert('La función de escaneo solo está disponible en móviles.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      // Muestra un loader
      this.loading = true;

      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = reader.result as string;

        try {
          // Reconoce el texto
          const texto = await this.ocrService.recognizeImage(imageData);
          console.log('Texto reconocido:', texto);

          // Verifica si hay texto
          if (!texto || texto.trim().length < 3) {
            this.loading = false;
            this.mostrarAlerta('Reconocimiento fallido', 'No se pudo reconocer texto suficiente en la imagen.');
            return;
          }

          // Busca en Scryfall usando "Dockside" en vez del nombre completo para mejorar resultados
          const textoOptimizado = this.optimizarBusqueda(texto);

          this.scryfallService.buscarCartas(textoOptimizado).subscribe(
            (result) => {
              this.loading = false;
              if (result && result.data && result.data.length > 0) {
                this.mostrarOpcionesCarta(result.data[0]);
              } else {
                this.mostrarAlerta('Carta no encontrada',
                  `No se encontraron coincidencias para "${textoOptimizado}". Texto reconocido: "${texto}"`);
              }
            },
            (error) => {
              this.loading = false;
              console.error('Error Scryfall:', error);

              // Intenta una búsqueda más simple en caso de error
              if (texto.length > 5) {
                const textoBusquedaSimple = texto.split(' ')[0]; // Solo la primera palabra
                this.intentarBusquedaSimplificada(textoBusquedaSimple, texto);
              } else {
                this.mostrarAlerta('Error',
                  `Error al buscar la carta. Texto reconocido: "${texto}"`);
              }
            }
          );
        } catch (error) {
          this.loading = false;
          this.mostrarAlerta('Error', 'Error al procesar la imagen');
          console.error(error);
        }
      };
      reader.readAsDataURL(file);
    };

    input.click();
  }

  optimizarBusqueda(texto: string): string {
    // Elimina caracteres problemáticos
    const textoLimpio = texto.replace(/[^\w\s]/gi, ' ').trim();

    // Extrae palabras clave (usa las dos primeras palabras si hay más de una)
    const palabras = textoLimpio.split(/\s+/);
    if (palabras.length > 1) {
      return palabras.slice(0, 2).join(' ');
    }
    return textoLimpio;
  }

// Intenta una búsqueda más simple si la primera falla
  intentarBusquedaSimplificada(palabraClave: string, textoOriginal: string) {
    this.loading = true;
    this.scryfallService.buscarCartas(palabraClave).subscribe(
      (result) => {
        this.loading = false;
        if (result && result.data && result.data.length > 0) {
          this.mostrarOpcionesCarta(result.data[0]);
        } else {
          this.mostrarAlerta('Carta no encontrada',
            `No se pudo encontrar ninguna carta con el texto "${textoOriginal}"`);
        }
      },
      (error) => {
        this.loading = false;
        this.mostrarAlerta('Error',
          `Error en la búsqueda. Texto original: "${textoOriginal}"`);
      }
    );
  }

// Alerta personalizada
  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

// Opciones para la carta encontrada
  async mostrarOpcionesCarta(carta: any) {
    const alert = await this.alertController.create({
      header: 'Carta encontrada',
      subHeader: carta.name,
      message: '¿Qué deseas hacer con esta carta?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Ver detalles',
          handler: () => {
            this.router.navigate(['/card-details', carta.id]);
          }
        },
        {
          text: 'Añadir a Wants',
          handler: () => {
            console.log('Añadiendo a Wants:', carta.name);
            // Implementar función para añadir a Wants
            this.addCardToWants(carta);
          }
        },
        {
          text: 'Añadir a Sells',
          handler: () => {
            console.log('Añadiendo a Sells:', carta.name);
            // Implementar función para añadir a Sells
            this.addCardToSells(carta);
          }
        }
      ]
    });
    await alert.present();
  }

  // Agregar estos métodos en home.page.ts
  async addCardToWants(carta: any) {
    this.loading = true;

    // Obtenemos los diferentes prints de la carta para mostrar opciones
    this.scryfallService.getCardPrints(carta.name).subscribe(
      (printData) => {
        this.loading = false;
        if (printData && printData.data) {
          // Mostrar modal para seleccionar la edición
          this.showPrintSelection(carta, printData.data, 'wants');
        } else {
          // Si no hay datos de ediciones, usar los datos actuales
          const price = carta.prices?.eur || carta.prices?.usd || 0;
          this.userProfileService.addCardToWants(
            carta.id,
            carta.name,
            carta.set,
            carta.set_name || '',
            parseFloat(price) || 0
          ).subscribe(
            () => {
              this.mostrarAlerta('Éxito', `${carta.name} añadida a tu lista de wants.`);
            },
            (error) => {
              console.error('Error al añadir carta a wants:', error);
              this.mostrarAlerta('Error', 'No se pudo añadir la carta a tu lista de wants.');
            }
          );
        }
      },
      (error) => {
        this.loading = false;
        console.error('Error al obtener ediciones:', error);
        this.mostrarAlerta('Error', 'No se pudieron obtener las ediciones de la carta.');
      }
    );
  }

  async addCardToSells(carta: any) {
    // Similar al anterior pero para sells
    this.loading = true;

    this.scryfallService.getCardPrints(carta.name).subscribe(
      (printData) => {
        this.loading = false;
        if (printData && printData.data) {
          this.showPrintSelection(carta, printData.data, 'sells');
        } else {
          const price = carta.prices?.eur || carta.prices?.usd || 0;
          this.userProfileService.addCardToSells(
            carta.id,
            carta.name,
            carta.set,
            carta.set_name || '',
            parseFloat(price) || 0
          ).subscribe(
            () => {
              this.mostrarAlerta('Éxito', `${carta.name} añadida a tu lista de sells.`);
            },
            (error) => {
              console.error('Error al añadir carta a sells:', error);
              this.mostrarAlerta('Error', 'No se pudo añadir la carta a tu lista de sells.');
            }
          );
        }
      },
      (error) => {
        this.loading = false;
        console.error('Error al obtener ediciones:', error);
        this.mostrarAlerta('Error', 'No se pudieron obtener las ediciones de la carta.');
      }
    );
  }

// Método para mostrar selección de ediciones
  async showPrintSelection(carta: any, prints: any[], listType: 'wants' | 'sells') {
    // Ordenar por fecha de lanzamiento
    const sortedPrints = prints.sort((a, b) =>
      new Date(b.released_at).getTime() - new Date(a.released_at).getTime()
    );

    const alert = await this.alertController.create({
      header: 'Seleccionar Edición',
      inputs: sortedPrints.map((print, idx) => ({
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

            if (listType === 'wants') {
              this.userProfileService.addCardToWants(
                selectedPrint.id,
                selectedPrint.name,
                selectedPrint.set,
                selectedPrint.set_name,
                parseFloat(price) || 0
              ).subscribe(
                () => {
                  this.mostrarAlerta('Éxito', `${selectedPrint.name} añadida a tu lista de wants.`);
                },
                (error) => {
                  console.error('Error al añadir carta a wants:', error);
                  this.mostrarAlerta('Error', 'No se pudo añadir la carta a tu lista de wants.');
                }
              );
            } else {
              this.userProfileService.addCardToSells(
                selectedPrint.id,
                selectedPrint.name,
                selectedPrint.set,
                selectedPrint.set_name,
                parseFloat(price) || 0
              ).subscribe(
                () => {
                  this.mostrarAlerta('Éxito', `${selectedPrint.name} añadida a tu lista de sells.`);
                },
                (error) => {
                  console.error('Error al añadir carta a sells:', error);
                  this.mostrarAlerta('Error', 'No se pudo añadir la carta a tu lista de sells.');
                }
              );
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Función para manejar el cambio de entrada en el campo de búsqueda
  onInputChange(term: string | null | undefined): void {
    const searchTerm = term ?? ''; // Si term es null o undefined, usa una cadena vacía
    this.searchTerms.next(searchTerm); // Envía el término de búsqueda al Subject
  }

  // Función para manejar la selección de una carta del desplegable
  seleccionarCarta(carta: any): void {
    this.router.navigate(['/card-details', carta.id]); // Navega a la página de detalles
  }

  // Función para manejar la búsqueda al presionar "Intro"
  buscarCarta(event?: Event): void {
    if ((!event || (event instanceof KeyboardEvent && event.key === 'Enter')) && this.nombreCarta.trim()) {
      this.router.navigate(['/card-list'], {
        queryParams: { q: this.nombreCarta.trim() }, // Pasa el término de búsqueda como parámetro
      });
    }
  }

  irAPerfil(): void {
    this.router.navigate(['/profile']);
  }

  // Función para cerrar la sesión
  cerrarSesion(): void {
    this.authService.cerrarSesion();
  }
}
