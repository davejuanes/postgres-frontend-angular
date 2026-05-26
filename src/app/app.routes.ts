import { Routes } from '@angular/router';
import { Mapa } from './mapa/mapa';
import { Usuarios } from './admin/usuarios/usuarios';
import { Roles } from './admin/roles/roles';

export const routes: Routes = [
  {
    path: '',
    component: Mapa
  },
  {
    path: 'admin',
    component: Usuarios
  },
  {
    path: 'admin/roles',
    component: Roles
  }
];
