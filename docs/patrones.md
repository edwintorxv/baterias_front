# Patrones

Este documento reúne las formas de hacer las cosas que se repiten en todo el front. Un componente nuevo debe seguirlas, para que la aplicación se comporte igual en todas las pantallas. Los patrones vienen de otro proyecto del responsable (`control_documental_front`), con sus errores ya corregidos.

## Componentes

- **Standalone**, cada uno con su `.html` y su `.scss`. Los módulos de PrimeNG se importan en cada componente que los usa, no en un módulo compartido.
- **Inyección por constructor**, no con `inject()`. Los campos que dependen de un servicio, como un `computed` sobre `authService.usuario`, se asignan dentro del constructor. `inject()` solo aparece en guards e interceptores, que son funciones.
- Entradas con `@Input` (con `required: true` cuando no tiene sentido sin el dato) y salidas con `@Output` + `EventEmitter`. Los nombres de las salidas son en español o los clásicos de Angular: `saved`, `cancel`, `editar`, `personas`.
- Comentario de clase (`/** … */`) que explica **para qué es y qué regla respeta**, no qué hace cada línea.

## Servicios

- Uno por recurso de la API, en `features/<modulo>/services/`, con `providedIn: 'root'`.
- La URL se arma con `environment.apiUrl`. Nunca se escribe la dirección del backend a mano.
- Devuelven `Observable<T>` con `map(r => r.data)` cuando la pantalla solo necesita el dato, y `Observable<ApiResponse<T>>` cuando muestra el `message` del backend (crear, actualizar, vincular, cargar).
- El comentario de cada método dice qué rol lo puede usar y los errores que el backend puede devolver con su significado (por ejemplo, "409 si el enlace ya no está vigente").
- Los servicios no muestran mensajes ni navegan: eso es de la pantalla.

## Formularios

```html
<input pInputText formControlName="nit" />
<app-error-campo [control]="clienteForm.get('nit')" />
```

- **Formularios reactivos** (`FormBuilder`), con los validadores de Angular (`required`, `maxLength`…) y los de `CustomValidators`.
- `<app-error-campo [control]>` debajo de cada campo muestra el primer error con su mensaje en español (`shared/validators/mensajes-validacion.ts`), solo cuando el campo ya se tocó o se cambió.
- **El botón Guardar está siempre habilitado.** Si el formulario es inválido, `markAllAsTouched()` hace aparecer todos los errores de una vez, en vez de dejar un botón gris sin explicar por qué.
- **Largos máximos iguales a los del backend** (las columnas de la base y los `@Size` de los DTO).
- Los campos vacíos se envían como `null`, no como cadena vacía.
- Las fechas se envían en **hora local**: `yyyy-MM-dd` o `yyyy-MM-ddTHH:mm:ss`, armadas a mano con `getFullYear()`, `getMonth()`… `toISOString()` las pasaría a UTC y una fecha de la noche quedaría en el día siguiente.
- Mientras se guarda, `guardando = true` deshabilita el botón para evitar el doble envío.

### Validadores propios

`shared/validators/custom-validators.ts`. Todos dejan pasar el campo vacío (para eso está `required`) y aceptan tildes, ñ y ü (`\p{L}`).

| Validador | Acepta |
|---|---|
| `nit` | 5 a 15 dígitos, con dígito de verificación opcional: `900123456-7` |
| `documento` | Letras, números y guion: cédulas, pasaportes, PPT |
| `soloLetras` | Nombres: letras, espacios, apóstrofo, punto y guion (`María José O'Neil-Peña`) |
| `texto` | Razón social, cargo y textos cortos: letras, números y puntuación común (`CALZADO S.A.S. & CÍA`) |
| `direccion` | Direcciones colombianas: `CARRERA 24 No. 5 - 55`, `Cra 45 # 12-30` |
| `telefono` | 7 a 10 dígitos, sin espacios |
| `soloNumeros` | Solo dígitos |
| `correoElectronico` | Formato de correo |
| `igualA(campo)` | Igual al campo hermano (confirmar contraseña) |

Un validador nuevo necesita también su mensaje en `mensajes-validacion.ts`; si no, el campo muestra "Valor inválido".

## Diálogos

```html
<p-dialog [(visible)]="displayFormDialog" header="Cliente" [modal]="true">
  @if (displayFormDialog) {
    <app-cliente-form-dialog [cliente]="selectedCliente" (saved)="clienteSaved($event)"
      (cancel)="displayFormDialog = false" />
  }
</p-dialog>
```

- La página tiene el `p-dialog` y un booleano `display…Dialog`. El contenido es un componente de `features`.
- **`@if (visible)` dentro del diálogo**: el componente se crea de nuevo en cada apertura, así que el formulario arranca limpio sin código para reiniciarlo, y vuelve a cargar los datos de la fila elegida.
- El diálogo avisa con `saved` cuando terminó bien. La página lo cierra y recarga el listado.
- `breakpoints` para que el diálogo ocupe más ancho en pantallas pequeñas.

## Acciones por fila (⚙️)

Las tablas no tienen una fila de botones: cada fila tiene un botón ⚙️ que abre un diálogo con **tarjetas de acción** (`app-cliente-acciones`, `app-persona-acciones`, `app-usuario-acciones`, `app-evaluador-acciones`). Cada tarjeta trae un ícono de color, un título y una línea que explica qué hace. Cuando el rol o el estado no permite la acción, la tarjeta queda **deshabilitada y explica por qué** ("Solo el administrador", "Sin aplicaciones").

## Listados y búsquedas

- El listado se pide completo al backend y se **filtra en el front**: los volúmenes son de cientos de filas por empresa.
- **Búsqueda sin mayúsculas ni tildes**: "medellin" encuentra "MEDELLÍN". Cada pantalla tiene su función `normalizar` (`normalize('NFD')` + quitar diacríticos + minúsculas).
- Las tarjetas de resumen de arriba (por estado, por situación) también filtran la tabla.
- Los filtros que sirven para enlazar pantallas van en la URL (`?anio=`, `?estado=`, `?idCliente=`).

## Catálogos

- Un modelo por archivo en `shared/models/`: `Catalogo` (`id`, `nombre`) como base, y `Departamento`, `CiudadMunicipio` (con `fkDepartamento`), `Industria` (con `fkSectorEconomico`) y `TipoCargo` (con `fkGrupoOcupacional`).
- Un solo `CatalogoService`, con caché por sesión del navegador (ver [Arquitectura](arquitectura.md#estado-y-sesión)).
- **Cascadas en el front**: se cargan todas las ciudades y todas las industrias una vez, y al elegir el departamento o el sector se filtra la lista. Al cambiar el padre, el hijo vuelve a `null`.
- Orden: los de la ficha de datos generales de la batería (sexo, estado civil, nivel académico, estrato, vivienda, tipo y tiempo de cargo, contrato, horas, salario) van **por id**, que es el orden del cuestionario ("Primaria incompleta, Primaria completa…"). Los demás van en orden alfabético.

## Mensajes

- Éxito: `ResponseHandlerUtil.handleResponse(respuesta, messageService)` → toast "Listo" con el `message` del backend.
- Error: `ResponseHandlerUtil.handleError(error, messageService)` → toast con el título según el código y el mensaje del backend. El 401 no se avisa, y el 403 y la falta de conexión ya los avisa el interceptor.
- Error dentro de la pantalla o del diálogo, sin toast: `ResponseHandlerUtil.describir(error).detalle`.
- Los textos se escriben tratando al usuario de **usted** ("Revise los datos", "Su sesión terminó").

## Descargas

```ts
this.informeEmpresaService.descargarWord(idCliente, anio).subscribe({
  next: archivo => guardarArchivo(archivo),
  error: error => ResponseHandlerUtil.handleError(error, this.messageService)
});
```

- El servicio pide con `responseType: 'blob'` y `observe: 'response'`, y pasa la respuesta por `comoArchivo('nombre_por_defecto.docx')` (`core/utils/archivo.util.ts`).
- `comoArchivo` toma el nombre de `Content-Disposition`, que el backend expone en CORS. Si hay error, convierte el `ApiError` que llega como `Blob` en JSON, para que `handleError` muestre el mensaje como en cualquier otra petición.
- `guardarArchivo` lanza la descarga del navegador.

## Cambios sin guardar

En pantallas donde se puede perder trabajo (la digitación):

- Un indicador `hayCambios` en la página.
- `canDeactivate` en la ruta, que pregunta con `confirm` antes de navegar a otra pantalla.
- `@HostListener('window:beforeunload')`, para que el navegador pregunte al cerrar o recargar la pestaña.
- Las acciones que recargan datos (cambiar una pregunta filtro, calcular) se deshabilitan mientras haya cambios sin guardar.
