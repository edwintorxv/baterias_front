# Contexto — Front de la Batería de Riesgo Psicosocial

> Forma de trabajo: **paso a paso** (diseño → código → el usuario revisa → commit cuando lo pide).
> Backend y reglas de negocio: `/Users/edwingacha/proyectos/backend/baterias_backend/CLAUDE.md` (sección 7 = estado del front).

## Puesta en marcha
- Angular 19 + PrimeNG 19 (tema Aura, `@primeuix/themes`), primeflex, primeicons. **pnpm** (`pnpm install`, `pnpm run dev` → 4200). Scripts de build aprobados en `pnpm-workspace.yaml` (`allowBuilds`).
- Lo arranca el usuario. Verificar con `pnpm build` (las páginas van con `loadComponent` para no pasar el presupuesto de 1,5 MB del bundle inicial).
- `src/environments/environment.development.ts` está en `.gitignore` (contraseñas de los usuarios de prueba de la BD local); se copia de `environment.development.example.ts`. El primero de `usuariosPrueba` entra solo al arrancar.
- `ng test` (Karma) no corre en el entorno de Claude (Chrome headless no arranca).

## Estructura y patrones (los del proyecto del usuario `control_documental_front`, con sus errores corregidos)
```
core/      models (ApiResponse/ApiError, sesión), services (auth, theme, catalogo con caché), interceptors, utils/response-handler
shared/    validators (CustomValidators + mensajes-validacion), components/error-campo, models (catálogos)
features/{modulo}/   models, services, components (x-table, x-form-dialog, x-acciones)
pages/{modulo}/      páginas (x-list, …)
layout/    main-layout (menú lateral fijo + topbar), menu.ts
```
- Constructor injection (no `inject()` en componentes); campos que usan servicios se asignan en el constructor.
- Respuestas del backend: `{ success, message, data }`; errores `ApiError { message, errorCode, details }` → `ResponseHandlerUtil.handleError` (título según el código HTTP). 403 y "sin conexión" los avisa el interceptor.
- Formularios: reactive forms, `<app-error-campo [control]>` debajo de cada campo, botón Guardar habilitado (marca todo como tocado si es inválido), largos máximos = los del backend, vacíos → `null`. Diálogo con `@if (visible)` para recrear el formulario en cada apertura.
- Validadores aceptan tildes y ñ (`\p{L}`): `nit`, `texto`, `direccion`, `telefono` (7–10 dígitos), `soloLetras`, `soloNumeros`, `correoElectronico`.
- Catálogos (industrias con `fkSectorEconomico`, departamentos, ciudades con `fkDepartamento`): se cargan una vez y las cascadas se filtran en el front.
- Acciones por fila: botón ⚙️ → diálogo con tarjetas (estilo del usuario). Búsquedas sin distinguir tildes/mayúsculas.
- Menú: todo visible por ahora; los botones que el rol no puede usar se ocultan o deshabilitan ("Solo el administrador").

## Estado
- ✅ Base (layout, auto-login dev, selector de usuario de prueba, tema claro/oscuro, Inicio con prueba de conexión).
- ✅ Clientes: listado + crear/editar (ADMIN; NIT no editable) + Personas (`/clientes/:id/personas`, PSICOLOGO).
- ⬜ Siguiente: informe de empresa del cliente (paso 3). Ver la lista completa en el CLAUDE.md del backend, sección 7.
