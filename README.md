# Batería de Riesgo Psicosocial — Front

Angular 19 + PrimeNG 19 (tema Aura), primeflex y primeicons. Backend: `baterias_backend` (`http://localhost:8080/api`).

## Puesta en marcha

```bash
pnpm install
cp src/environments/environment.development.example.ts src/environments/environment.development.ts
# poner las contraseñas de los usuarios de prueba de la BD local
pnpm dev             # http://localhost:4200 (o pnpm start)
```

`environment.development.ts` está en `.gitignore` (lleva contraseñas). En desarrollo la app entra sola con el
primer usuario de la lista y la barra superior trae el selector **Usuario de prueba** para cambiar de rol.
En producción (`environment.ts`) no hay auto-login.

## Estructura

```
src/app/
  core/       models (ApiResponse, sesión), services (auth, theme), interceptors (token + 401/403), utils (mensajes de error)
  layout/     main-layout (menú lateral fijo + barra superior), menu.ts (opciones del menú)
  pages/      una carpeta por pantalla
```

El menú muestra todas las opciones (sin filtrar por rol): el backend aplica los permisos y responde 403.
