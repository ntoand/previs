import { Injectable } from '@angular/core';
import { environment } from "@env/environment";
import { Socket } from "ngx-socket-io";

@Injectable({
  providedIn: 'root'
})
export class SocketioService extends Socket {

  constructor() { 
    super({
      url: environment.ws_url,
      options: {}
    });
  }

  sendMessage(action, data) {
    console.log('socket sendMessage', action, data);
    this.emit(action, data);
  }

  // listeners
  // tag
  tagsReceived$ = this.fromEvent("admingettags");
  updateTagReceived$ = this.fromEvent("adminupdatetag");
  updateTagCollectionReceived$ = this.fromEvent("adminupdatetagcollection");
  deleteTagReceived$ = this.fromEvent("admindeletetags");
  
  // collection
  collectionsReceived$ = this.fromEvent("admingetcollections");
  addCollectionReceived$ = this.fromEvent("adminaddcollection");
  updateCollectionReceived$ = this.fromEvent("adminupdatecollection");
  deleteCollectionReceived$ = this.fromEvent("admindeletecollection");

  // upload
  processUploadReceived$ = this.fromEvent("processupload");
  processMytardisReceived$ = this.fromEvent("processmytardis");

  // share
  updateShareEmailReceived$ = this.fromEvent("adminupdateshareemail");

  // profile
  apiKeyReceived$ = this.fromEvent("processapikey");
}
