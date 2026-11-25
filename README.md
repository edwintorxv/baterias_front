# PsicoBatería — front

Aplicación web del sistema de aplicación y calificación de la **Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial** (Ministerio de Trabajo de Colombia, Res. 2764 de 2022). La usan los psicólogos que evalúan a los trabajadores de sus empresas cliente, el administrador del sistema y las empresas cliente, que consultan su informe.

Qué permite hacer:

- **Psicólogo**: cargar y vincular a los trabajadores de cada empresa (a mano o con la plantilla de Excel), crear aplicaciones, digitar las respuestas, calcular los resultados, completar y descargar el informe individual (PDF y Word) y el informe de empresa (Word), y consultar las estadísticas de cada empresa.
- **Administrador**: empresas cliente, usuarios y sus empresas asignadas, evaluadores con su firma, y consulta de catálogos y cuestionarios.
- **Cliente**: el informe y las estadísticas de su empresa, en solo lectura.

Toda la lógica y los permisos viven en el backend: [baterias_backend](https://github.com/edwintorxv/baterias_backend). El front muestra, valida antes de enviar y orienta al usuario, pero nunca es la única barrera.

## Stack

| | |
|---|---|
| Framework | Angular 19 (componentes *standalone*, carga perezosa por ruta) |
| Componentes | PrimeNG 19 con el tema Aura y el preset propio PsicoBatería (`@primeuix/themes`) |
| Estilos | primeflex (utilidades), primeicons, fuente Inter |
| Gráficos | chart.js 4.4.7, a través de `p-chart` |
| Paquetes | **pnpm** (versión fija en `packageManager` de `package.json`), Node 24 (`.node-version`) |

## Puesta en marcha local

### Requisitos

- Node 24 y pnpm. Con Corepack basta `corepack enable`: la versión de pnpm la fija `package.json`.
- El backend corriendo en `http://localhost:8080/api` (ver su README).

### 1. Dependencias

```bash
pnpm install
```

`pnpm-workspace.yaml` autoriza los scripts de instalación que necesita el Angular CLI (`esbuild`, `lmdb`…). Sin esa lista, pnpm los bloquea.

### 2. Archivo de entorno de desarrollo

```bash
cp src/environments/environment.development.example.ts \
   src/environments/environment.development.ts
```

Pon en `usuariosPrueba` el correo y la contraseña de los usuarios de **tu base local**. El primero de la lista entra solo al arrancar, y todos aparecen en el selector **Usuario de prueba** de la barra superior para cambiar de rol sin cerrar sesión. `environment.development.ts` está en `.gitignore` porque lleva contraseñas: **nunca va a git**.

| Archivo | Cuándo se usa | Qué trae |
|---|---|---|
| `environment.development.ts` | `pnpm dev` (`ng serve`) | API local y usuarios de prueba |
| `environment.ts` | `pnpm build` (producción) | API de Render, sin usuarios de prueba |
| `environment.model.ts` | — | La forma de los dos anteriores |

### 3. Arrancar

```bash
pnpm dev             # http://localhost:4201
```

El puerto es **4201** a propósito: si se comparte el 4200 con otros proyectos, el navegador mezcla el `localStorage` (donde está la sesión) y el favicon guardado.

El backend debe aceptar el origen del front en CORS. En desarrollo acepta cualquier puerto de `localhost`.

## Compilar

```bash
pnpm build           # → dist/baterias_front/browser
```

El presupuesto del bundle inicial es de **1,5 MB** (aviso) y **2 MB** (error), en `angular.json`. Por eso todas las páginas se cargan con `loadComponent`: una página importada directo en las rutas lleva su código y el de sus componentes de PrimeNG al bundle inicial.

## Pruebas

Solo existe la prueba que genera el Angular CLI (`app.component.spec.ts`, Karma + Jasmine). La verificación se hace compilando (`pnpm build`) y probando las pantallas contra el backend local con un usuario de cada rol.

## Estructura

```
src/
├── app/
│   ├── core/          lo de toda la app: sesión, guards, interceptor, catálogos, tema
│   ├── shared/        validadores, error de campo y modelos de catálogos
│   ├── features/      un módulo por área: modelos, servicios y componentes
│   ├── pages/         una carpeta por pantalla (ruta), armada con features
│   ├── layout/        marco con menú lateral y barra superior; menú por rol (menu.ts)
│   ├── app.routes.ts  rutas, roles de cada una y guards
│   └── app.config.ts  proveedores: router, HTTP, PrimeNG, idioma es-CO, arranque
├── environments/      URL de la API y usuarios de prueba
├── styles.scss        estilos globales
└── index.html         título, íconos y color del tema
public/                logo.svg, favicon.ico y apple-touch-icon.png
```

El detalle está en [Arquitectura](docs/arquitectura.md).

## Convenciones

- Código, textos de pantalla, comentarios y commits **en español**.
- Inyección por **constructor**, no con `inject()` en los componentes.
- Componentes *standalone*, cada uno con su `.html` y su `.scss`.
- El backend siempre responde `ApiResponse<T>` (`{ success, message, data }`) y los errores como `ApiError`, que se muestran con `ResponseHandlerUtil`.
- Los largos máximos de los formularios son los del backend.
- Las búsquedas no distinguen mayúsculas ni tildes.

## Despliegue

Producción es un **static site de Render** (`https://baterias-front.onrender.com`) que despliega la rama **`despliegue`**, no `main`:

```bash
git branch -f despliegue main && git push origin despliegue
```

El detalle (comando de build, regla de reescritura, CORS) está en [Despliegue](docs/despliegue.md).

## Documentación técnica

| Documento | Contenido |
|---|---|
| [Arquitectura](docs/arquitectura.md) | Capas, flujo de una pantalla, estado y sesión, carga perezosa, cómo agregar una pantalla |
| [Pantallas](docs/pantallas.md) | Mapa de rutas y roles, menú, qué hace cada pantalla |
| [Seguridad](docs/seguridad.md) | Ingreso y sesión, guards, interceptor, contraseñas por enlace, ayudas de desarrollo |
| [Patrones](docs/patrones.md) | Servicios, formularios y validadores, diálogos, acciones por fila, catálogos, mensajes, descargas |
| [Gráficos y tema](docs/graficos-y-tema.md) | Tema y modo oscuro, colores de los niveles, componentes de gráficos, marca |
| [Despliegue](docs/despliegue.md) | Static site de Render, cómo desplegar, problemas conocidos |
| [Decisiones](docs/decisiones.md) | Qué se decidió, por qué y qué se descartó; temas por decidir |

Hay una **versión en Word** de todo lo anterior, en un solo documento, que se genera desde estos `.md` con la herramienta `herramientas/manuales` del backend (`npm run generar:front`). Si cambias un manual, vuelve a generarla.
