import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEsCo from '@angular/common/locales/es-CO';
import { ApplicationConfig, LOCALE_ID, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { catchError, of } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { PsicoBateriaPreset } from './core/theme/psicobateria.preset';
import { ResponseHandlerUtil } from './core/utils/response-handler.util';

registerLocaleData(localeEsCo);

/** Antes de mostrar nada: tema guardado y, en desarrollo, entrar con el usuario de prueba. */
const inicializar = () => {
  inject(ThemeService).loadTheme();
  const messageService = inject(MessageService);
  return inject(AuthService).autoLogin().pipe(
    catchError(error => {
      ResponseHandlerUtil.handleError(error, messageService);
      return of(null);
    })
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: PsicoBateriaPreset,
        options: {
          darkModeSelector: '.dark'
        }
      }
    }),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    MessageService,
    provideAppInitializer(inicializar)
  ]
};
