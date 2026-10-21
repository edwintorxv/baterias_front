import { Component, Signal, computed } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { PanelMenu } from 'primeng/panelmenu';
import { menuPara } from '../../menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [PanelMenu],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  /** Se rearma al cambiar el usuario de la sesión (en desarrollo, con el selector de usuario de prueba). */
  menu: Signal<MenuItem[]>;

  constructor(authService: AuthService) {
    this.menu = computed(() => menuPara(authService.usuario()));
  }

}
