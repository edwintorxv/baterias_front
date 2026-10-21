import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../../core/services/auth.service';
import { ResponseHandlerUtil } from '../../../core/utils/response-handler.util';
import { EvaluadorFirmaDialogComponent } from '../../../features/evaluadores/components/evaluador-firma-dialog/evaluador-firma-dialog.component';
import { Evaluador } from '../../../features/evaluadores/models/evaluador.model';
import { EvaluadorService } from '../../../features/evaluadores/services/evaluador.service';

/**
 * El psicólogo ve sus datos de evaluador y carga su firma (solo la suya: los demás evaluadores los ve el
 * administrador). Los datos los corrige el administrador.
 */
@Component({
  selector: 'app-mi-firma',
  standalone: true,
  imports: [DatePipe, CardModule, MessageModule, TagModule, EvaluadorFirmaDialogComponent],
  templateUrl: './mi-firma.component.html',
  styleUrl: './mi-firma.component.scss'
})
export class MiFirmaComponent implements OnInit {

  evaluador?: Evaluador;
  sinEvaluador = false;
  cargando = false;

  constructor(
    private evaluadorService: EvaluadorService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const idEvaluador = this.authService.usuario()?.idEvaluador;
    if (!idEvaluador) {
      this.sinEvaluador = true;
      return;
    }
    this.cargando = true;
    this.evaluadorService.obtener(idEvaluador).subscribe({
      next: evaluador => {
        this.evaluador = evaluador;
        this.cargando = false;
      },
      error: error => {
        this.cargando = false;
        ResponseHandlerUtil.handleError(error, this.messageService);
      }
    });
  }

  /** El componente de la firma ya avisa que se guardó: aquí solo se actualizan los datos. */
  firmaGuardada(evaluador: Evaluador): void {
    this.evaluador = evaluador;
  }

  volver(): void {
    this.router.navigate(['/inicio']);
  }

}
