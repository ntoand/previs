import { Component, OnInit, Input } from '@angular/core';
import { AppService } from '../../core/app.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-uploadlink',
  templateUrl: './uploadlink.component.html',
  styleUrls: ['./uploadlink.component.css']
})
export class UploadlinkComponent implements OnInit {

  constructor(private appService: AppService, private authService: AuthService) { }
  
  urlStr = '';
  extStr = 'zip';
  errMsg = '';
  
  @Input() dataType: string;

  ngOnInit() {
  }

  onGoClick($event) {
    $event.preventDefault();
    this.errMsg = '';
    console.log('go clicked');
    if (this.urlStr.indexOf('google') === -1) {
      this.errMsg = 'Please provide valid Google Drive shared link';
      return;
    }
    this.appService.sendMsg({action: 'processupload', data: {task: "process", url: this.urlStr, ext: this.extStr, datatype: this.dataType, uploadtype: 'link',
                                                              userId: this.authService.userDetails.uid, userEmail: this.authService.userDetails.email } });
    
    let x = document.querySelector("#processing_anchor");
    if (x){
        x.scrollIntoView();
    }
  }

}
