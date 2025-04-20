import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private router: Router) {}

  registrar(usuario: any) {
    return this.http.post(`${this.apiUrl}/registro`, usuario).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ocurrió un error inesperado';
        if (error.status === 400) {
          // Si recibimos el nuevo formato de errores
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
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', usuario);
  }

  estaAutenticado(): boolean {
    return !!localStorage.getItem('token');
  }

  cerrarSesion() {
    // Limpieza completa del localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    // Eliminar cualquier otro dato de sesión que pueda haberse almacenado
    localStorage.removeItem('userId');


    window.location.href = '/login'; // Usar en vez de Router para forzar recarga completa
  }

  getUsuarioActual(): string {
    return localStorage.getItem('usuario') || '';
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error en la autenticación';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del backend
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
