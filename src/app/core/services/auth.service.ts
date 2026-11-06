import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioPrueba } from '../../../environments/environment.model';
import { ApiResponse } from '../models/api-response.model';
import { EnlaceContrasena } from '../models/enlace-contrasena.model';
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

    login(correo: string, contrasena: string): Observable<UsuarioSesion> {
        return this.http.post<ApiResponse<LoginResponse>>(`${this.url}/login`, { correo, contrasena }).pipe(
            map(respuesta => respuesta.data),
            tap(sesion => this.guardar(sesion)),
            map(sesion => sesion.usuario)
        );
    }

    /** Público: si el enlace de contraseña sirve y para quién (siempre 200; el estado dice si se puede usar). */
    consultarEnlace(codigo: string): Observable<EnlaceContrasena> {
        return this.http.get<ApiResponse<EnlaceContrasena>>(`${this.url}/enlace`, { params: { codigo } })
            .pipe(map(respuesta => respuesta.data));
    }

    /**
     * Público: define la contraseña con el enlace (un solo uso) y cierra las sesiones abiertas del usuario.
     * Devuelve su correo para llevarlo al inicio de sesión. 409 si el enlace ya no está vigente.
     */
    definirContrasena(codigo: string, contrasena: string): Observable<string> {
        return this.http.post<ApiResponse<string>>(`${this.url}/enlace`, { codigo, contrasena })
            .pipe(map(respuesta => respuesta.data));
    }

    /**
     * Cambia la propia contraseña. El backend cierra las sesiones de los demás equipos y devuelve un token nuevo, que
     * reemplaza al actual (el anterior ya no sirve). 400 si la actual no coincide o la nueva es igual; 429 tras varios
     * intentos fallidos (mismo freno del login). Devuelve el mensaje del backend.
     */
    cambiarContrasena(actual: string, nueva: string): Observable<string> {
        return this.http.put<ApiResponse<LoginResponse>>(`${this.url}/contrasena`, { actual, nueva }).pipe(
            tap(respuesta => this.guardar(respuesta.data)),
            map(respuesta => respuesta.message)
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
        return this.login(inicial.correo, inicial.contrasena);
    }

    /** Vuelve a entrar con el mismo usuario de prueba (token vencido) o con el primero. */
    reingresar(): Observable<UsuarioSesion> | null {
        const usuarios = this.usuariosPrueba();
        const actual = usuarios.find(u => u.correo === this.usuario()?.correo) ?? usuarios[0];
        return actual ? this.login(actual.correo, actual.contrasena) : null;
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
