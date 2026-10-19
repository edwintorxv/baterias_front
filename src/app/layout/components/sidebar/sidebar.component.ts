import { Component } from '@angular/core';
import { PanelMenu } from 'primeng/panelmenu';
import { MENU } from '../../menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [PanelMenu],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  menu = MENU;

}
