import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { mensajeValidacion } from '../../validators/mensajes-validacion';

/** Mensaje de error debajo de un campo, cuando ya se tocó. Uso: <app-error-campo [control]="form.get('nit')" /> */
@Component({
  selector: 'app-error-campo',
  standalone: true,
  template: `
    @if (mensaje) {
      <small class="error-campo">{{ mensaje }}</small>
    }
  `,
  styles: [`
    .error-campo {
      display: block;
      margin-top: 0.25rem;
      color: var(--p-red-500);
    }
  `]
})
export class ErrorCampoComponent {

  @Input() control: AbstractControl | null = null;

  get mensaje(): string | null {
    return this.control && this.control.invalid && (this.control.touched || this.control.dirty)
      ? mensajeValidacion(this.control.errors)
      : null;
  }

}
