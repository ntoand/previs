import { Component, OnInit } from '@angular/core';
import { AppService } from '@app/core/services/app.service';
import { UploadfileComponent } from './uploadfile/uploadfile.component';
import { UploadlinkComponent } from './uploadlink/uploadlink.component';
import { Dataset } from '../shared/dataset.model';
import { MytardisComponent } from './mytardis/mytardis.component';

import { AuthService } from '@app/core/services/auth.service';
import { LoginComponent } from '../login/login.component';
import { environment } from '../../environments/environment';
import { SocketioService } from '@app/core/services/socketio.service';
import { ITag } from '@app/core/models/tag.model';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  
  message = { type: "", content: "" };
  tag: ITag = null;
  
  navPath = "upload";

  photogrammetryEnabled = environment.photogrammetry;

  constructor(private socket: SocketioService, 
              private appService: AppService, public authService: AuthService) { }

  ngOnInit() {
    this.appService.setMenuIdx(1);
    
    var scope = this;
    scope.socket.processUploadReceived$.subscribe((data: any)=>{
      if(data.status !== 'done') {
        scope.message.type = data.status;
        scope.message.content = data.result;
      }
      else {
        let result = data.result;
        scope.message.type = 'success';
        scope.message.content = 'Please write down this tag ' + result.tag + ' for later use';
        scope.tag = scope.appService.parseTagFromResult(data.result, scope.authService.userDetails.email);
      }
    });  

  }

}
