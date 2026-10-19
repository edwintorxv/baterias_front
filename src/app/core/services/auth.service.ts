import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioPrueba } from '../../../environments/environment.model';
import { ApiResponse } from '../models/api-response.model';
import { LoginResponse, UsuarioSesion } from '../models/sesion.model';

const CLAVE_TOKEN = 'token';
const CLAVE_EXPIRA = 'token-expira';
const CLAVE_USUARIO = 'usuario';

/** Sesión con el backend: token en localStorage y el usuario como signal para el layout. */
@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly url = `${environment.apiUrl}/auth`;

    readonly usuario = signal<UsuarioSesion | null>(this.leerUsuario());

    constructor(private http: HttpClient) { }

    login(usuario: string, contrasena: string): Observable<UsuarioSesion> {
        return this.http.post<ApiResponse<LoginResponse>>(`${this.url}/login`, { usuario, contrasena }).pipe(
            map(respuesta => respuesta.data),
            tap(sesion => this.guardar(sesion)),
            map(sesion => sesion.usuario)
        );
    }

    logout(): void {
        localStorage.removeItem(CLAVE_TOKEN);
        localStorage.removeItem(CLAVE_EXPIRA);
        localStorage.removeItem(CLAVE_USUARIO);
        this.usuario.set(null);
    }

    token(): string | null {
        return this.sesionVigente() ? localStorage.getItem(CLAVE_TOKEN) : null;
    }

    /** El token sigue sirviendo (con un minuto de margen). */
    sesionVigente(): boolean {
        const expira = Number(localStorage.getItem(CLAVE_EXPIRA));
        return !!localStorage.getItem(CLAVE_TOKEN) && expira - 60_000 > Date.now();
    }

    // ---------------------------------------------------------------------------------------------
    // Solo desarrollo: entra sin pantalla de login con los usuarios de environment.development.ts
    // ---------------------------------------------------------------------------------------------

    usuariosPrueba(): UsuarioPrueba[] {
        return environment.production ? [] : environment.usuariosPrueba;
    }

    /** Al arrancar: si no hay sesión vigente, entra con el primer usuario de prueba. */
    autoLogin(): Observable<unknown> {
        const inicial = this.usuariosPrueba()[0];
        if (this.sesionVigente() || !inicial) {
            return of(null);
        }
        return this.login(inicial.usuario, inicial.contrasena);
    }

    /** Vuelve a entrar con el mismo usuario de prueba (token vencido) o con el primero. */
    reingresar(): Observable<UsuarioSesion> | null {
        const usuarios = this.usuariosPrueba();
        const actual = usuarios.find(u => u.usuario === this.usuario()?.usuario) ?? usuarios[0];
        return actual ? this.login(actual.usuario, actual.contrasena) : null;
    }

    private guardar(sesion: LoginResponse): void {
        localStorage.setItem(CLAVE_TOKEN, sesion.token);
        localStorage.setItem(CLAVE_EXPIRA, String(new Date(sesion.expira).getTime()));
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(sesion.usuario));
        this.usuario.set(sesion.usuario);
    }

    private leerUsuario(): UsuarioSesion | null {
        try {
            return JSON.parse(localStorage.getItem(CLAVE_USUARIO) ?? 'null');
        } catch {
            return null;
        }
    }

}
