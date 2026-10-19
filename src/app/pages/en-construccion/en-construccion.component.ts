import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';

/** Pantalla provisional de las opciones del menú que todavía no existen. */
@Component({
  selector: 'app-en-construccion',
  standalone: true,
  imports: [CardModule],
  template: `
    <h1 class="mt-0 text-2xl">{{ titulo }}</h1>
    <p-card>
      <p class="m-0"><i class="pi pi-wrench mr-2"></i>Pantalla en construcción.</p>
    </p-card>
  `
})
export class EnConstruccionComponent {

  titulo: string;

  constructor(route: ActivatedRoute) {
    this.titulo = route.snapshot.data['titulo'] ?? '';
  }

}
