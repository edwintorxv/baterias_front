# Registro de decisiones

Este documento reúne las decisiones del front que no se deducen del código, o que podrían parecer un error a quien llega nuevo al proyecto. Cada una dice **qué se decidió**, **por qué** y, cuando aplica, **qué se descartó**. Las decisiones de negocio y del backend están en `baterias_backend/docs/decisiones.md`.

**Antes de cambiar algo de esta lista, hay que hablarlo con el responsable del proyecto.** Casi todas son pedidos explícitos, no detalles de implementación.

Para agregar una decisión: va en su tema, con la fecha (`AAAA-MM-DD`) y el motivo. Si reemplaza a otra, la anterior no se borra: se marca como *reemplazada* y se enlaza la nueva.

## Arquitectura y código

**Patrones de `control_documental_front`**, otro proyecto del responsable, con sus errores corregidos: `core` / `shared` / `features` / `pages` / `layout`, acciones por fila con ⚙️ y tarjetas, diálogos con el formulario dentro.
- *Motivo*: el responsable ya conoce esa forma de trabajar y puede mantener los dos proyectos igual.
- Ver [Arquitectura](arquitectura.md) y [Patrones](patrones.md).

**Inyección por constructor**, no con `inject()` en los componentes.
- *Motivo*: preferencia del responsable, igual que en su otro proyecto.

**Sin librería de estado** (ni NgRx ni similares). El usuario de la sesión es un `signal` en `AuthService`; el resto vive en cada página.
- *Motivo*: cada pantalla pide sus datos al entrar y no hay estado compartido complejo. Una librería agregaría código sin resolver nada.

**Todas las páginas con `loadComponent`.**
- *Motivo*: el bundle inicial tiene un presupuesto de 1,5 MB, y PrimeNG con chart.js lo pasan si se cargan todas las páginas al inicio.

**2026-11-25 · Funciones comunes en `core/utils`**: `normalizar` (búsqueda sin tildes, `texto.util.ts`) y `fechaLocal` / `fechaHoraLocal` (`fecha.util.ts`), que estaban copiadas en 8 y 4 archivos. Se borró la página `en-construccion`, que ya no usaba ninguna ruta.
- *Motivo*: una sola versión de cada regla; un cambio (por ejemplo, cómo se busca) se hace en un solo lugar.

**pnpm, y puerto 4201 en desarrollo** (2026-10-28).
- *Motivo del puerto*: el 4200 lo usan otros proyectos del responsable, y el navegador compartía con ellos el `localStorage` (la sesión) y el favicon guardado.

## Seguridad

**2026-10-21 · Menú por rol.** *Reemplaza* a "menú con todo visible y el backend responde 403", que se usó mientras se construían las pantallas.
- *Motivo*: con el login real, cada rol debe ver solo lo que puede usar. El CLIENTE no tiene listado de clientes: su menú lleva directo a su empresa.

**Los permisos los decide el backend.** Los guards, el menú y los botones deshabilitados solo orientan al usuario; los roles de cada ruta copian la tabla de `SecurityConfig`.
- *Consecuencia*: si cambia un permiso en el backend, hay que cambiar también `app.routes.ts` y `menu.ts`.

**Las acciones que el rol no puede usar se deshabilitan con el motivo** ("Solo el administrador"), en vez de ocultarse.
- *Motivo*: que el usuario entienda por qué no puede hacer algo, en vez de pensar que la opción no existe.

**2026-10-21 · Los evaluadores solo los ve el ADMIN.** El psicólogo carga su firma en **Mi firma**, desde el menú de su nombre.
- *Motivo*: los evaluadores son los demás psicólogos; uno no necesita ver los datos ni la firma de otro.

**2026-11-25 · Las ayudas de desarrollo se quedan en el código**: auto-login, selector "Usuario de prueba", botones "Entrar como" y reingreso ante un 401. Solo funcionan con `environment.production = false`; en el build de producción no aparecen. *Reemplaza* a la del 2026-10-21 ("se quedan hasta producción y ahí se decide").
- *Motivo*: agilizan las pruebas en local con los tres roles, y en producción ya están apagadas porque `environment.ts` no trae usuarios de prueba.

**2026-10-29 · Contraseñas solo por enlace y sin "¿Olvidó su contraseña?".** El administrador nunca ve ni escribe contraseñas; genera un enlace que llega por correo. Quien olvida la suya llama por teléfono al administrador.
- *Motivo*: una contraseña enviada por correo quedaría en la bandeja y en los registros de Brevo.
- *Descartado*: asignar la contraseña desde Usuarios (con un generador), que existió hasta el 2026-11-06.

## Pantallas y datos

**Vincular persona no busca ni prellena por documento.** Siempre se captura todo; el mensaje del backend dice si la persona fue nueva, si se vinculó, si se actualizó o si cambió de empresa.
- *Motivo*: decisión del responsable: siempre se vuelven a capturar. Cada vinculación guarda su propia foto de los datos personales y laborales.

**La plantilla de carga de personas siempre se descarga vacía.**
- *Motivo*: protección de datos; nunca se exportan personas ya cargadas.

**2026-10-20 · La forma A o B la elige el psicólogo** al crear la aplicación, con la descripción de los grupos ocupacionales del manual y sin ninguna marcada por defecto. Si no coincide con el tipo de cargo registrado, solo se avisa.
- *Motivo*: el tipo de cargo registrado no siempre refleja el trabajo real; el criterio es del psicólogo.

**2026-10-20 · Nunca se calcula una aplicación incompleta.** El botón se habilita solo en *Pendiente de cálculo* y dice qué falta; el backend también lo exige.
- *Motivo*: un cálculo con faltantes podría tomarse como definitivo.

**En la digitación, cada pregunta muestra un ícono de respondida o sin responder en lugar de su número.**
- *Motivo*: decisión del responsable, para evitar confusiones al digitar.

**2026-10-21 · El Inicio no muestra niveles de riesgo ni mezcla datos de varias empresas.**
- *Motivo*: el Inicio es para organizar el trabajo; los resultados se leen en el informe o en las estadísticas de cada empresa, con su contexto.

**Las estadísticas se calculan en el backend**, con el mismo análisis del Word. El front solo las dibuja.
- *Motivo*: la pantalla y el documento siempre dan las mismas cifras, y las reglas (participantes del año, confidencialidad, ranking) están en un solo lugar.

## Gráficos

**Tabla más barras agrupadas por nivel.** Ni barras 100 % apiladas ni mapas de calor.
- *Motivo*: preferencia del responsable, igual que en el Word del informe de empresa.

**2026-10-21 · Se mantiene la paleta semáforo de los niveles**, aunque el amarillo y el verde claro tienen poco contraste.
- *Motivo*: son los colores del Word y los que el psicólogo y la empresa ya reconocen.
- *Compensación*: siempre hay tabla al lado, leyenda y un borde tenue en las barras.

## Por decidir

| Tema | Estado |
|---|---|
| Pruebas automatizadas: solo existe la prueba que genera el Angular CLI | Hoy se verifica con `pnpm build` y probando cada rol a mano |
| Pantalla Administración → Ingresos (`registro_ingreso` del backend) | Opcional |
