import { Injectable, inject } from '@angular/core';
import { ApplicationRef } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { AuthService } from './auth.service';

@Injectable(
  { providedIn: 'root' }
)
export class MeTubeSocket extends Socket {

  constructor() {
    const appRef = inject(ApplicationRef);
    const authService = inject(AuthService);

    const path =
      document.location.pathname.replace(/share-target/, '') + 'socket.io';
    
    const token = authService.token;
    const auth = token ? { token } : {};

    super({ url: '', options: { path, auth } }, appRef);
  }
}
