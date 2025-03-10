import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Importa Router
import { ScryfallService } from '../services/scryfall.service';
import {
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonCol, IonContent, IonGrid, IonHeader,
  IonItem, IonLabel, IonList, IonRow,
  IonSpinner, IonTitle, IonToolbar
} from "@ionic/angular/standalone";

@Component({
  selector: 'app-card-list',
  templateUrl: './card-list.page.html',
  styleUrls: ['./card-list.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class CardListPage implements OnInit {
  cartas: any[] = [];
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router, // Agregamos Router para la navegación
    private scryfallService: ScryfallService
  ) {}

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap.get('q');
    if (query) {
      this.scryfallService.buscarCartas(query).subscribe(
        data => {
          this.cartas = data.data || [];
          this.loading = false;
        },
        error => {
          this.loading = false;
          console.error('Error al buscar cartas:', error);
        }
      );
    }
  }

  // Función para navegar al detalle de la carta
  irADetalle(carta: any) {
    this.router.navigate(['/card-details', carta.id]);
  }
}
