# Contexto — Front de la Batería de Riesgo Psicosocial

> Forma de trabajo: **paso a paso** (diseño → código → el usuario revisa → commit cuando lo pide).
> Backend y reglas de negocio: `/Users/edwingacha/proyectos/backend/baterias_backend/CLAUDE.md` (sección 7 = estado del front).
> Repo `https://github.com/edwintorxv/baterias_front.git`, rama `main`. Última actualización: 2026-10-19 (todo en `origin/main`).
> **Para retomar**: siguiente paso a elegir por el usuario: crear/editar usuarios y contraseña, o administración de evaluadores. El informe individual está en pausa (ver Estado).

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
- Catálogos: un modelo por archivo en `shared/models/` (`Catalogo` base; `Departamento`, `CiudadMunicipio` con `fkDepartamento`, `Industria` con `fkSectorEconomico`), sin wrappers (el backend siempre responde `ApiResponse<T>`); un solo `CatalogoService` con caché. Se cargan una vez y las cascadas se filtran en el front. Los de la ficha de la batería (sexo, estado civil, nivel académico, estrato, vivienda, tipo/tiempo de cargo, contrato, horas, salario) van **por id** (orden del cuestionario); el resto, alfabético.
- Acciones por fila: botón ⚙️ → diálogo con tarjetas (estilo del usuario). Búsquedas sin distinguir tildes/mayúsculas.
- Menú: todo visible por ahora; los botones que el rol no puede usar se ocultan o deshabilitan ("Solo el administrador").

## Estado
- ✅ Base (layout, auto-login dev, selector de usuario de prueba, tema claro/oscuro, Inicio con prueba de conexión).
- ✅ Clientes: listado + crear/editar (ADMIN; NIT no editable) + Personas (`/clientes/:id/personas`, PSICOLOGO).
- ✅ Informe de empresa (`/clientes/:id/informe`, PSICOLOGO y CLIENTE): año, cobertura, nivel de la empresa y periodicidad, resultados globales (`app-distribucion-niveles`, colores `COLOR_NIVEL` del Word), conclusiones + plan de acción + firmante (`app-informe-conclusiones`; opciones: el propio si está activo y el que ya tenía), descarga del Word cuando `faltantes` está vacío (el error en Blob se convierte a `ApiError`). El detalle por forma/ciudad/área queda solo en el Word.
- ✅ Carga de personas por archivo (en Personas): "Descargar plantilla" (siempre vacía) y "Cargar archivo" → `app-carga-personas-dialog`: valida al elegir el .xlsx, resumen por resultado (Nueva/Vincula/Actualiza/Cambia de empresa/Error, filtra la tabla), filas con sus errores, "Confirmar carga" solo sin errores (todo o nada). Descargas de archivos con `core/utils/archivo.util.ts` (`comoArchivo` + `guardarArchivo`; convierte el ApiError que llega como Blob).
- ✅ Vincular persona (en Personas): `app-vincular-persona-dialog` con secciones Persona / Datos personales / Datos laborales, cascadas departamento → ciudad (residencia y trabajo), fecha de vinculación con calendario (se envía yyyy-MM-dd local). **No busca ni prellena por documento** (decisión del usuario: siempre se recaptura; el mensaje del backend dice si fue nueva, vincula, actualiza o cambia de empresa).
- ✅ Editar e inactivar/activar desde el ⚙️ de cada fila de Personas (`app-persona-acciones`): editar reutiliza `app-vincular-persona-dialog` con `[edicion]` (documento bloqueado; guarda la relación y, si cambió, la persona con `PUT /evaluados/{id}`); `app-persona-estado-dialog` inactiva con fecha de retiro o activa (409 del backend si está activa en otra empresa). Relación inactiva: "Editar" deshabilitado (el backend también lo rechaza). Tarjeta "Inactivas" en el resumen (el listado arranca en Activos). Modelos y servicios de persona y relación en `features/evaluados/`.
- ✅ Administración → Usuarios (solo ADMIN): listado con rol, vínculo (evaluador/empresa; el EVALUADO sin nombre: el admin no ve trabajadores), clientes asignados por psicólogo, buscador y filtro por rol; ⚙️ → "Clientes asignados" (`app-clientes-asignados-dialog`: casillas con búsqueda, marcar todos/ninguno sobre lo visible, `PUT /usuarios/{id}/clientes` reemplaza la lista). Crear/editar/contraseña: "Próximamente".
- ⏸️ Informe individual por fila: en pausa (el usuario valida confidencialidad: ¿basta estar asignado al cliente o solo el evaluador que firmó?; ¿evaluador y observaciones se completan en el diálogo o en Aplicaciones?). Hoy solo 1 de 200 aplicaciones de CARDINS tiene evaluador.
- ⬜ Siguiente: crear/editar usuarios y contraseña, o administración de evaluadores. Ver la lista completa en el CLAUDE.md del backend, sección 7.
