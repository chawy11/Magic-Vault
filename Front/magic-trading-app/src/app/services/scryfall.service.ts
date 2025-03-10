import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ScryfallService {
  private baseUrl: string = 'https://api.scryfall.com';

  constructor(private http: HttpClient) {}

  // Método para buscar cartas por nombre (usando /cards/search)
  buscarCartas(query: string): Observable<any> {
    const url = `${this.baseUrl}/cards/search?q=${encodeURIComponent(query)}`;
    return this.http.get<any>(url);
  }

  // Método para obtener los detalles de una carta por su ID
  obtenerDetallesCarta(id: string): Observable<any> {
    const url = `${this.baseUrl}/cards/${id}`;
    return this.http.get<any>(url);
  }
}
