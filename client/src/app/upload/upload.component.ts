import { Component, OnInit } from '@angular/core';
import { AppService } from '@app/core/services/app.service';
import { UploadfileComponent } from './uploadfile/uploadfile.component';
import { UploadlinkComponent } from './uploadlink/uploadlink.component';
import { MytardisComponent } from './mytardis/mytardis.component';

import { AuthService } from '@app/core/services/auth.service';
import { LoginComponent } from '../login/login.component';
import { environment } from '../../environments/environment';
import { SocketioService } from '@app/core/services/socketio.service';
import { ITag } from '@app/core/models/tag.model';

import { IAppState } from '@app/core/store/state/app.state';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { selectUser } from '@app/core/store/selectors/user.selector';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  
  subHandles = [];

  message = { type: "", content: "" };
  tag: ITag = null;
  dataTypes = [];
  uploadedFile = '';
  showResultDiv = false;
  disableProcessButton = false;
  
  navPath = "upload";

  // store
  appstate$: Observable<IAppState>;
  
  constructor(private store: Store<IAppState>, private socket: SocketioService, 
              private appService: AppService, public authService: AuthService) { }

  ngOnInit() {
    this.appService.setMenuIdx(1);
    
    var scope = this;
    scope.appstate$ = this.store;

    var h1 = scope.socket.processUploadReceived$.subscribe((data: any)=>{
      scope.showResultDiv = true;

      if(data.status !== 'done') {
        scope.message.type = data.status;
        scope.message.content = data.result;
        return;
      }

      if(data.task === 'getdatatypes') {
        scope.tag = null;
        scope.dataTypes = [];
        
        let result = data.result;
        if(result.datatypes.length === 0) {
          scope.message.type = 'warning';
          scope.message.content = 'Failed to detect data types. Please check your data or select a datatype';
          var keys = Object.keys(environment.datatypes);
          for(var i=0; i<keys.length; i++) {
            if(environment.datatypes[keys[i]] === true) {
              scope.dataTypes.push(keys[i]);
            }
          }
        }
        else {
          scope.message.type = 'success';
          scope.message.content = 'Datatypes detected';
          scope.dataTypes = result.datatypes.filter( item => environment.datatypes[item] === true);
        }
        scope.appService.dataType = scope.dataTypes[0];
        scope.uploadedFile = result.file;
        
        scope.disableProcessButton = false;
        if(scope.dataTypes.length === 1 && scope.appService.dataType !== 'volume') {
          scope.processUploadedData();
        }
      }

      else { // data.task === process
        let result = data.result;
        scope.message.type = 'success';
        scope.message.content = 'Processed tag ' + result.tag;
        scope.tag = scope.appService.parseTagFromResult(data.result, scope.authService.userDetails.email);
        scope.appService.needReload = true;
        console.log(scope.appService.dataType, scope.dataTypes);
      }

    });  
    this.subHandles.push(h1);

    // user
    var h2 = scope.appstate$.pipe(
      select(selectUser),
      map(user => user)
    ).subscribe(user =>{
      if(user.item) scope.appService.mytardis.apiKey = user.item.mytardisApikey;
    });
    this.subHandles.push(h2);

  }

  ngOnDestroy() {
    for(var i=0; i < this.subHandles.length; i++) {
      this.subHandles[i].unsubscribe();
    }
  }

  processUploadedData() {
    const userDetails = {
      uid: this.authService.userDetails.uid,
      email: this.authService.userDetails.email,
      displayName: this.authService.userDetails.displayName
    };
    this.socket.sendMessage('processupload', {task: "process", file: this.uploadedFile, datatype: this.appService.dataType, uploadtype: this.appService.uploadType,
                                              userDetails: userDetails, settings: this.appService.settings } );
  }

  onProcessClick($event) {
    $event.preventDefault();
    this.disableProcessButton = true;
    this.processUploadedData();
  }

}
