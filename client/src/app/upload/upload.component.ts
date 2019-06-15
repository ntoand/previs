import { Component, OnInit } from '@angular/core';
import { AppService } from '../core/app.service';
import { UploadfileComponent } from './uploadfile/uploadfile.component';
import { UploadlinkComponent } from './uploadlink/uploadlink.component';
import { Dataset } from '../shared/dataset.model';
import { MytardisComponent } from './mytardis/mytardis.component';

import { AuthService } from '../core/auth.service';
import { LoginComponent } from '../login/login.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  
  connection;
  dataType: string = "volume";
  uploadType: string = "local";
  // advanded options for volume data
  settings = {
    voxelSizeX: 1,
    voxelSizeY: 1,
    voxelSizeZ: 1,
    channel: 0,
    time: 0,
    sendEmail: false,
  };
  
  message = { type: "", content: "" };
  dataset: Dataset = new Dataset();
  
  navPath = "upload";

  photogrammetryEnabled = environment.photogrammetry;

  constructor(private appService: AppService, public authService: AuthService) { }

  ngOnInit() {
    this.appService.setMenuIdx(1);
    
    var scope = this;
    this.connection = this.appService.onMessage().subscribe(msg => {
      if(msg.action === 'processupload') {
        //console.log(msg.data);
        const data = msg.data;
        if(data.status !== 'done') {
          scope.message.type = data.status;
          scope.message.content = data.result;
        }
        else {
          let result = data.result;
          scope.message.type = 'success';
          scope.message.content = 'Please write down this tag ' + result.tag + ' for later use';
          scope.dataset.parseResultData(data.result, scope.authService.userDetails.email);
          //this.appService.setLock(false);
        }
      }
    });
    
    localStorage.setItem('currentDatatype','volume');
  }
  
  ngOnDestroy() {
    this.connection.unsubscribe();
  }
  
  onChange($event) {
    localStorage.setItem('currentDatatype', $event.value);
  }

}
