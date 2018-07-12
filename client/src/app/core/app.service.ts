import { Injectable } from '@angular/core';
import { Observer, Observable } from 'rxjs';
import * as socketIo from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable()
export class AppService {
  
  // ===== Websocket ====
  private socket;
  private initialized = false;

  private initSocket(): void {
      if(!this.initialized) {
          console.log('initSocket', environment.ws_url);
          this.socket = socketIo(environment.ws_url);
          this.initialized = true;
      }
  }

  public sendMsg(message): void {
      this.initSocket();
      this.socket.emit('message', message);
  }

  public onMessage(): Observable<any> {
      this.initSocket();
      return new Observable<any>(observer => {
          this.socket.on('message', (data) => observer.next(data));
      });
  }
  
  // ===== MENU =====
  private menuidx;

  getMenuIdx(): number {
    return this.menuidx;
  }

  setMenuIdx(id: number) {
    this.menuidx = id;
  }
  
  // ===== OTHERS =====
  private locked = false; // to check if dataset is being processed
  isLocked() {
    return this.locked;
  }
  setLock(locked) {
    this.locked = locked;
  }

}
