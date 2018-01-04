import { Injectable } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { Observable, Subject } from 'rxjs/Rx';

@Injectable()
export class AppService {
  
  messages: Subject<any>;

  constructor(private wsService: WebsocketService) {
    this.messages = <Subject<any>>wsService
      .connect()
      .map((response: any): any => {
        return response;
      })
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
  
  // ===== REVIEW ====
  private review_data;
  

}
