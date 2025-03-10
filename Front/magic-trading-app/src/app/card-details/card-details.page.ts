import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ScryfallService } from '../services/scryfall.service';
import {
  IonCard, IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";

@Component({
  selector: 'app-card-details',
  templateUrl: './card-details.page.html',
  styleUrls: ['./card-details.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class CardDetailsPage implements OnInit {
  carta: any;

  constructor(
    private route: ActivatedRoute,
    private scryfallService: ScryfallService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.scryfallService.obtenerDetallesCarta(id).subscribe(
        data => {
          this.carta = data;
        },
        error => {
          console.error('Error al obtener los detalles de la carta:', error);
        }
      );
    }
  }
}
