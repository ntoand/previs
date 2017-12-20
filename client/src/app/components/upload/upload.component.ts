import { Component, OnInit } from '@angular/core';
import { AppService } from '../../services/app.service';
import { UploadfileComponent } from '../uploadfile/uploadfile.component';
import { UploadlinkComponent } from '../uploadlink/uploadlink.component';
import { Dataset } from '../../models/dataset';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  
  dataType: string = "volume";
  uploadType: string = "local";
  
  message = { type: "", content: "" };
  dataset: Dataset = new Dataset();

  constructor(private appService: AppService) { }

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
        }
      }
    });
  }

}
