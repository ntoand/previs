import { Component, OnInit, Input } from '@angular/core';
import { AppService } from '@app/core/services/app.service';
import { AuthService } from '@app/core/services/auth.service';
import { SocketioService } from '@app/core/services/socketio.service';

@Component({
  selector: 'app-uploadlink',
  templateUrl: './uploadlink.component.html',
  styleUrls: ['./uploadlink.component.css']
})
export class UploadlinkComponent implements OnInit {

  constructor(private socket: SocketioService,
              public appService: AppService, public authService: AuthService) { }
  
  urlStr = '';
  extStr = 'zip';
  errMsg = '';
  
  ngOnInit() {
  }

  onImportClick($event) {
    $event.preventDefault();
    this.errMsg = '';
    console.log('go clicked');
    if (this.urlStr.indexOf('google') === -1) {
      this.errMsg = 'Please provide valid Google Drive shared link';
      return;
    }

    this.socket.sendMessage('processupload', {task: "getdatatypes", url: this.urlStr, ext: this.extStr, datatype: this.appService.dataType, uploadtype: 'link'});
    
    let x = document.querySelector("#processing_anchor");
    if (x){
        x.scrollIntoView();
    }
  }

}
