import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { Observable, Subject, pipe } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class AppService {
  
  // ===== Websocket ====
  messages: Subject<any>;

  constructor(private wsService: WebsocketService) {
    this.messages = <Subject<any>>wsService
      .connect()
      .pipe(
        map((response: any): any => {
          return response;
        })
      )
      
    this.locked = false;
  }
  
  sendMsg(msg) {
    this.messages.next(msg);
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
  private locked; // to check if dataset is being processed
  isLocked() {
    return this.locked;
  }
  setLock(locked) {
    this.locked = locked;
  }

}
