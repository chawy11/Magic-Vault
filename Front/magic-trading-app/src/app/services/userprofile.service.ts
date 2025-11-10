import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserprofileService {
  // Use environment configuration for API URL
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Headers are now managed by the HTTP interceptor
  // Removed getHeaders() method as it's no longer needed

  getMyProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/profile/me`);
  }

  getMatchingCards(otherUsername: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/matches/${otherUsername}/cards`);
  }

  addCardToWants(cardId: string, cardName: string, setCode: string = '', setName: string = '', price: number = 0): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/wants`,
      { cardId, cardName, edition: setName, setCode, price }
    );
  }

  addCardToSells(cardId: string, cardName: string, setCode: string = '', setName: string = '', price: number = 0): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/sells`,
      { cardId, cardName, edition: setName, setCode, price }
    );
  }

  updateCardInWants(cardId: string, quantity: number, edition: string, language: string, foil: boolean, price: number = 0, setCode: string = ''): Observable<any> {
    return this.http.put(`${this.apiUrl}/user/wants/${cardId}`,
      { quantity, edition, language, foil, price, setCode }
    );
  }

  updateCardInSells(cardId: string, quantity: number, edition: string, language: string, foil: boolean, price: number = 0, setCode: string = ''): Observable<any> {
    return this.http.put(`${this.apiUrl}/user/sells/${cardId}`,
      { quantity, edition, language, foil, price, setCode }
    );
  }

  removeCardFromWants(cardId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/user/wants/${cardId}`);
  }

  removeCardFromSells(cardId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/user/sells/${cardId}`);
  }

  getProfileByUsername(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile/${username}`);
  }

  getMatches(otherUsername: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/matches/${otherUsername}`);
  }
}
