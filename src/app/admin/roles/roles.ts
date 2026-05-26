import { Component } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { Usuarios } from '../usuarios/usuarios';

@Component({
  standalone: true,
  selector: 'app-roles',
  imports: [ButtonModule, Usuarios],
  templateUrl: './roles.html',
  styleUrls: ['./roles.scss'],
})
export class Roles {}
