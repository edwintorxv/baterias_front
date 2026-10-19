import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, Signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import { NOMBRE_ROL, UsuarioSesion } from '../../core/models/sesion.model';
import { AuthService } from '../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../core/utils/response-handler.util';

/** Bienvenida y prueba de conexión: GET /auth/yo confirma que el token sirve. */
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CardModule, TagModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss'
})
export class InicioComponent implements OnInit {

  usuario: Signal<UsuarioSesion | null>;
  nombreRol = NOMBRE_ROL;
  apiUrl = environment.apiUrl;

  estado: 'cargando' | 'ok' | 'error' = 'cargando';
  mensajeError = '';

  constructor(private http: HttpClient, authService: AuthService) {
    this.usuario = authService.usuario;
  }

  ngOnInit(): void {
    this.http.get<ApiResponse<UsuarioSesion>>(`${environment.apiUrl}/auth/yo`).subscribe({
      next: () => this.estado = 'ok',
      error: (error: HttpErrorResponse) => {
        this.estado = 'error';
        this.mensajeError = ResponseHandlerUtil.describir(error).detalle;
      }
    });
  }

}
