import { Component, OnInit } from '@angular/core';
import { AppService } from '../core/app.service';
import { UploadfileComponent } from './uploadfile/uploadfile.component';
import { UploadlinkComponent } from './uploadlink/uploadlink.component';
import { Dataset } from '../shared/dataset.model';
import { MytardisComponent } from './mytardis/mytardis.component';

import { AuthService } from '../core/auth.service';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  
  dataType: string = "volume";
  uploadType: string = "local";
  // advanded options for volume data
  settings = {
    voxelSizeX: 1,
    voxelSizeY: 1,
    voxelSizeZ: 1,
    channel: 0,
    time: 0
  };
  
  message = { type: "", content: "" };
  dataset: Dataset = new Dataset();
  
  navPath = "upload";

  constructor(private appService: AppService, public authService: AuthService) { }

  ngOnInit() {
    this.appService.setMenuIdx(1);
    
    this.appService.messages.subscribe(msg => {
      if(msg.action === 'processupload') {
        console.log(msg.data);
        const data = msg.data;
        if(data.status !== 'done') {
          this.message.type = data.status;
          this.message.content = data.result;
        }
        else {
          const result = data.result;
          this.message.type = 'success';
          this.message.content = 'Please write down this tag ' + result.tag + ' for later use';
          this.dataset.parseResult(data);
          this.appService.setLock(false);
        }
      }
    });
    
    localStorage.setItem('currentDatatype','volume');
  }
  
  onChange($event) {
    localStorage.setItem('currentDatatype', $event.value);
  }

}
