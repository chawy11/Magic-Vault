
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Headers are now managed by the HTTP interceptor
  // Removed getHeaders() method as it's no longer needed

  createTransaction(sellerId: string, buyerWants: any[], sellerWants: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/transaction/create`,
      { sellerId, buyerWants, sellerWants }
    );
  }

  getMyTransactions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transactions`);
  }

  confirmTransaction(transactionId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/transaction/${transactionId}/confirm`, {});
  }

  addReview(transactionId: string, rating: number, comment: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/transaction/${transactionId}/review`,
      { rating, comment }
    );
  }

}
