import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = API_CONFIG.baseUrl;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private storage: StorageService
  ) {}

  registrar(usuario: any) {
    return this.http.post(`${this.apiUrl}/registro`, usuario).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ocurrió un error inesperado';
        if (error.status === 400) {
          if (error.error.errores) {
            return throwError(() => new Error(JSON.stringify(error.error.errores)));
          } else {
            errorMessage = error.error.message;
          }
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  login(credenciales: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credenciales).pipe(
      catchError(this.handleError)
    );
  }

  guardarToken(token: string, usuario: string) {
    this.storage.setToken(token);
    this.storage.setUsername(usuario);
  }

  estaAutenticado(): boolean {
    return !!this.storage.getToken();
  }

  cerrarSesion() {
    this.storage.removeToken();
    this.storage.removeUsername();
    this.storage.removeUserId();

    window.location.href = '/login';
  }

  getUsuarioActual(): string {
    return this.storage.getUsername() || '';
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error en la autenticación';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 400) {
        errorMessage = error.error.message || 'Usuario o contraseña incorrectos';
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
      } else {
        errorMessage = `Error ${error.status}: ${error.error.message || 'Error desconocido'}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
